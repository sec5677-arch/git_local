import type {
  BoardResponse,
  CreateTicketInput,
  ReorderResult,
  ReorderTicketInput,
  Ticket,
  UpdateTicketInput,
} from '@/shared/types/ticket';

export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function getBoard(): Promise<BoardResponse> {
  return request<BoardResponse>('/api/tickets', { method: 'GET' });
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return request<Ticket>('/api/tickets', jsonInit('POST', input));
}

export function updateTicket(id: number, input: UpdateTicketInput): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${id}`, jsonInit('PATCH', input));
}

export function deleteTicket(id: number): Promise<void> {
  return request<void>(`/api/tickets/${id}`, { method: 'DELETE' });
}

export function completeTicket(id: number): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${id}/complete`, { method: 'PATCH' });
}

export function reorderTicket(
  ticketId: number,
  status: ReorderTicketInput['status'],
  position: number
): Promise<ReorderResult> {
  return request<ReorderResult>('/api/tickets/reorder', jsonInit('PATCH', { ticketId, status, position }));
}
