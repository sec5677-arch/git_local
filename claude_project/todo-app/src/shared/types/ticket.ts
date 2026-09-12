import { z } from 'zod';
import type { tickets } from '@/server/db/schema';
import type {
  createTicketSchema,
  updateTicketSchema,
  reorderTicketSchema,
} from '@/shared/validations/ticket';
import type { TicketStatus } from '@/shared/constants';

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ReorderTicketInput = z.infer<typeof reorderTicketSchema>;

export type Ticket = typeof tickets.$inferSelect;

export type TicketWithOverdue = Ticket & { isOverdue: boolean };

export type Board = Record<TicketStatus, TicketWithOverdue[]>;

export type BoardResponse = {
  board: Board;
  total: number;
};

export type ReorderResult = {
  ticket: Ticket;
  affected: { id: number; position: number }[];
};
