import { useCallback, useState } from 'react';
import {
  getBoard,
  createTicket,
  updateTicket,
  deleteTicket,
  completeTicket,
  reorderTicket,
} from '@/client/api/ticketApi';
import { calculatePosition } from '@/client/lib/position';
import { TICKET_STATUS, type TicketStatus } from '@/shared/constants';
import type {
  Board,
  CreateTicketInput,
  ReorderResult,
  ReorderTicketInput,
  Ticket,
  TicketWithOverdue,
  UpdateTicketInput,
} from '@/shared/types/ticket';

function computeIsOverdue(ticket: Pick<Ticket, 'dueDate' | 'status'>): boolean {
  if (!ticket.dueDate) return false;
  if (ticket.status === TICKET_STATUS.DONE) return false;
  const today = new Date().toISOString().split('T')[0];
  return ticket.dueDate < today;
}

function findTicket(board: Board, ticketId: number): TicketWithOverdue | null {
  for (const status of Object.keys(board) as TicketStatus[]) {
    const found = board[status].find((t) => t.id === ticketId);
    if (found) return found;
  }
  return null;
}

function removeFromBoard(board: Board, ticketId: number): Board {
  const next = { ...board };
  for (const status of Object.keys(next) as TicketStatus[]) {
    next[status] = next[status].filter((t) => t.id !== ticketId);
  }
  return next;
}

function insertSorted(list: TicketWithOverdue[], ticket: TicketWithOverdue): TicketWithOverdue[] {
  const withoutTicket = list.filter((t) => t.id !== ticket.id);
  const index = withoutTicket.findIndex((t) => t.position > ticket.position);
  const insertAt = index === -1 ? withoutTicket.length : index;
  return [...withoutTicket.slice(0, insertAt), ticket, ...withoutTicket.slice(insertAt)];
}

/** Removes `ticket` from wherever it currently sits and re-inserts it, sorted by position, into its own status column. */
function moveInBoard(board: Board, ticket: TicketWithOverdue): Board {
  const next = removeFromBoard(board, ticket.id);
  const status = ticket.status as TicketStatus;
  next[status] = insertSorted(next[status], ticket);
  return next;
}

function buildOptimisticReorderTicket(
  current: TicketWithOverdue,
  status: ReorderTicketInput['status'],
  position: number
): TicketWithOverdue {
  let startedAt = current.startedAt;
  if (status === TICKET_STATUS.TODO && current.status !== TICKET_STATUS.TODO) {
    startedAt = new Date();
  } else if (current.status === TICKET_STATUS.TODO && status === TICKET_STATUS.BACKLOG) {
    startedAt = null;
  }
  const completedAt = current.status === TICKET_STATUS.DONE ? null : current.completedAt;

  const optimistic: TicketWithOverdue = {
    ...current,
    status,
    position,
    startedAt,
    completedAt,
    isOverdue: false,
  };
  optimistic.isOverdue = computeIsOverdue(optimistic);
  return optimistic;
}

function applyReorderResult(board: Board, result: ReorderResult): Board {
  let next = moveInBoard(board, { ...result.ticket, isOverdue: computeIsOverdue(result.ticket) });
  for (const affected of result.affected) {
    const affectedTicket = findTicket(next, affected.id);
    if (!affectedTicket) continue;
    next = moveInBoard(next, { ...affectedTicket, position: affected.position });
  }
  return next;
}

export function useTickets(initialData: Board) {
  const [board, setBoard] = useState<Board>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAction = useCallback(async (action: () => Promise<unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      await action();
      const response = await getBoard();
      setBoard(response.board);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(
    (data: CreateTicketInput) => runAction(() => createTicket(data)),
    [runAction]
  );

  const update = useCallback(
    (id: number, data: UpdateTicketInput) => runAction(() => updateTicket(id, data)),
    [runAction]
  );

  const remove = useCallback((id: number) => runAction(() => deleteTicket(id)), [runAction]);

  // reorder/complete follow COMPONENT_SPEC.md §4's optimistic-update pattern instead of
  // runAction's refresh-from-server pattern: the drag already shows the card in its new
  // spot, so re-fetching the whole board would just flash it back and forth.
  const reorder = useCallback(
    async (ticketId: number, status: ReorderTicketInput['status'], position: number) => {
      let backup: Board | null = null;

      setBoard((prev) => {
        backup = prev;
        const current = findTicket(prev, ticketId);
        if (!current) return prev;
        return moveInBoard(prev, buildOptimisticReorderTicket(current, status, position));
      });

      if (!backup) return false;

      setIsLoading(true);
      setError(null);
      try {
        const result = await reorderTicket(ticketId, status, position);
        setBoard((prev) => applyReorderResult(prev, result));
        return true;
      } catch (err) {
        setBoard(backup);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const complete = useCallback(async (id: number) => {
    let backup: Board | null = null;

    setBoard((prev) => {
      backup = prev;
      const current = findTicket(prev, id);
      if (!current) return prev;
      const position = calculatePosition(
        prev.DONE.map((t) => t.position),
        0
      );
      const optimisticTicket: TicketWithOverdue = {
        ...current,
        status: TICKET_STATUS.DONE,
        completedAt: new Date(),
        position,
        isOverdue: false,
      };
      return moveInBoard(prev, optimisticTicket);
    });

    if (!backup) return false;

    setIsLoading(true);
    setError(null);
    try {
      const updated = await completeTicket(id);
      setBoard((prev) => moveInBoard(prev, { ...updated, isOverdue: false }));
      return true;
    } catch (err) {
      setBoard(backup);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { board, isLoading, error, create, update, remove, reorder, complete };
}
