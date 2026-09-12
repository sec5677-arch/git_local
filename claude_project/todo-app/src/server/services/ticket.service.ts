import { asc, eq, sql } from 'drizzle-orm';
import { db, tickets } from '@/server/db';
import { TICKET_STATUS, TICKET_PRIORITY, type TicketStatus } from '@/shared/constants';
import type {
  Board,
  BoardResponse,
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

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const [{ minPosition }] = await db
    .select({ minPosition: sql<number | null>`min(${tickets.position})` })
    .from(tickets)
    .where(sql`${tickets.status} = ${TICKET_STATUS.BACKLOG}`);

  const position = (minPosition ?? 0) - 1024;

  const [ticket] = await db
    .insert(tickets)
    .values({
      title: input.title,
      description: input.description ?? null,
      status: TICKET_STATUS.BACKLOG,
      priority: input.priority ?? TICKET_PRIORITY.MEDIUM,
      position,
      plannedStartDate: input.plannedStartDate ?? null,
      dueDate: input.dueDate ?? null,
      startedAt: null,
      completedAt: null,
    })
    .returning();

  return ticket as Ticket;
}

export async function getBoard(): Promise<BoardResponse> {
  const allTickets = (await db
    .select()
    .from(tickets)
    .orderBy(asc(tickets.position))) as Ticket[];

  const board: Board = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };

  const doneCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const ticket of allTickets) {
    if (ticket.status === TICKET_STATUS.DONE) {
      if (!ticket.completedAt || ticket.completedAt < doneCutoff) {
        continue;
      }
    }
    const withOverdue: TicketWithOverdue = {
      ...ticket,
      isOverdue: computeIsOverdue(ticket),
    };
    board[ticket.status as TicketStatus].push(withOverdue);
  }

  const total = Object.values(board).reduce((sum, list) => sum + list.length, 0);

  return { board, total };
}

export async function getTicketById(id: number): Promise<TicketWithOverdue | null> {
  const [ticket] = (await db.select().from(tickets).where(eq(tickets.id, id))) as Ticket[];
  if (!ticket) return null;

  return { ...ticket, isOverdue: computeIsOverdue(ticket) };
}

export async function updateTicket(
  id: number,
  input: UpdateTicketInput
): Promise<Ticket | null> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if ('title' in input) updates.title = input.title;
  if ('description' in input) updates.description = input.description;
  if ('priority' in input) updates.priority = input.priority;
  if ('plannedStartDate' in input) updates.plannedStartDate = input.plannedStartDate;
  if ('dueDate' in input) updates.dueDate = input.dueDate;

  const [updated] = await db
    .update(tickets)
    .set(updates)
    .where(eq(tickets.id, id))
    .returning();

  return (updated as Ticket) ?? null;
}

export async function completeTicket(id: number): Promise<Ticket | null> {
  const [{ minPosition }] = await db
    .select({ minPosition: sql<number | null>`min(${tickets.position})` })
    .from(tickets)
    .where(sql`${tickets.status} = ${TICKET_STATUS.DONE}`);

  const position = (minPosition ?? 0) - 1024;

  const [updated] = await db
    .update(tickets)
    .set({
      status: TICKET_STATUS.DONE,
      completedAt: new Date(),
      position,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, id))
    .returning();

  return (updated as Ticket) ?? null;
}

export async function deleteTicket(id: number): Promise<boolean> {
  const deleted = await db
    .delete(tickets)
    .where(eq(tickets.id, id))
    .returning({ id: tickets.id });

  return deleted.length > 0;
}

/**
 * The client sends the target `position` it already computed (typically a
 * BACKLOG/TODO/IN_PROGRESS midpoint between two neighboring cards, or an
 * edge value). This function persists it as-is, then — because `position`
 * is an integer column — checks whether the destination column now has a
 * duplicate position (the only way an integer gap can be "less than 1" per
 * docs/API_SPEC.md's rebalancing rule) and, if so, renumbers that entire
 * column to 1024-spaced values, returning the other rows it touched.
 */
export async function reorderTicket(
  input: ReorderTicketInput
): Promise<ReorderResult | null> {
  return db.transaction(async (tx) => {
    const [existing] = (await tx
      .select()
      .from(tickets)
      .where(eq(tickets.id, input.ticketId))) as Ticket[];

    if (!existing) return null;

    const updates: Record<string, unknown> = {
      status: input.status,
      position: input.position,
      updatedAt: new Date(),
    };

    if (
      input.status === TICKET_STATUS.TODO &&
      existing.status !== TICKET_STATUS.TODO
    ) {
      updates.startedAt = new Date();
    } else if (
      existing.status === TICKET_STATUS.TODO &&
      input.status === TICKET_STATUS.BACKLOG
    ) {
      updates.startedAt = null;
    }

    if (existing.status === TICKET_STATUS.DONE) {
      updates.completedAt = null;
    }

    const [updated] = (await tx
      .update(tickets)
      .set(updates)
      .where(eq(tickets.id, input.ticketId))
      .returning()) as Ticket[];

    const columnTickets = (await tx
      .select()
      .from(tickets)
      .where(eq(tickets.status, input.status))
      .orderBy(asc(tickets.position))) as Ticket[];

    const positions = columnTickets.map((t) => t.position);
    const hasDuplicate = new Set(positions).size !== positions.length;

    let finalTicket = updated;
    const affected: { id: number; position: number }[] = [];

    if (hasDuplicate) {
      for (let i = 0; i < columnTickets.length; i++) {
        const newPosition = (i + 1) * 1024;
        if (columnTickets[i].position === newPosition) continue;

        await tx
          .update(tickets)
          .set({ position: newPosition })
          .where(eq(tickets.id, columnTickets[i].id));

        if (columnTickets[i].id === updated.id) {
          finalTicket = { ...finalTicket, position: newPosition };
        } else {
          affected.push({ id: columnTickets[i].id, position: newPosition });
        }
      }
    }

    return { ticket: finalTicket, affected };
  });
}
