import { NextResponse } from 'next/server';
import { updateTicketSchema } from '@/shared/validations/ticket';
import {
  getTicketById,
  updateTicket,
  deleteTicket,
} from '@/server/services/ticket.service';
import {
  validationError,
  notFoundError,
  internalError,
  parseTicketId,
} from '@/server/lib/api-errors';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id: rawId } = await params;
  const id = parseTicketId(rawId);
  if (id === null) {
    return validationError('유효하지 않은 티켓 ID입니다');
  }

  try {
    const ticket = await getTicketById(id);
    if (!ticket) {
      return notFoundError();
    }
    return NextResponse.json(ticket, { status: 200 });
  } catch {
    return internalError();
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id: rawId } = await params;
  const id = parseTicketId(rawId);
  if (id === null) {
    return validationError('유효하지 않은 티켓 ID입니다');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationError('요청 본문이 올바른 JSON이 아닙니다');
  }

  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0].message);
  }

  try {
    const updated = await updateTicket(id, parsed.data);
    if (!updated) {
      return notFoundError();
    }
    const ticket = await getTicketById(id);
    return NextResponse.json(ticket, { status: 200 });
  } catch {
    return internalError();
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id: rawId } = await params;
  const id = parseTicketId(rawId);
  if (id === null) {
    return validationError('유효하지 않은 티켓 ID입니다');
  }

  try {
    const deleted = await deleteTicket(id);
    if (!deleted) {
      return notFoundError();
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return internalError();
  }
}
