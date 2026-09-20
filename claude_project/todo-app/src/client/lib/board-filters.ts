import { TICKET_STATUS, type TicketStatus } from '@/shared/constants';
import type { Board, TicketWithOverdue } from '@/shared/types/ticket';

export type BoardFilter = 'all' | 'thisWeek' | 'overdue';

const FILTERABLE_STATUSES: TicketStatus[] = [TICKET_STATUS.TODO, TICKET_STATUS.IN_PROGRESS];

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getMonday(date: Date): Date {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  return monday;
}

function getSunday(date: Date): Date {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

export function isThisWeek(ticket: TicketWithOverdue): boolean {
  if (!ticket.dueDate) return false;
  if (ticket.status === TICKET_STATUS.BACKLOG || ticket.status === TICKET_STATUS.DONE) {
    return false;
  }

  const today = new Date();
  const monday = toDateString(getMonday(today));
  const sunday = toDateString(getSunday(today));

  return ticket.dueDate >= monday && ticket.dueDate <= sunday;
}

export function filterBoard(board: Board, filter: BoardFilter): Board {
  if (filter === 'all') return board;

  const predicate = filter === 'thisWeek' ? isThisWeek : (t: TicketWithOverdue) => t.isOverdue;

  const next = { ...board };
  for (const status of FILTERABLE_STATUSES) {
    next[status] = next[status].filter(predicate);
  }
  return next;
}

export function countForFilters(board: Board): { thisWeek: number; overdue: number } {
  const filterable = FILTERABLE_STATUSES.flatMap((status) => board[status]);
  return {
    thisWeek: filterable.filter(isThisWeek).length,
    overdue: filterable.filter((t) => t.isOverdue).length,
  };
}
