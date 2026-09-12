import { NextResponse } from 'next/server';
import { completeTicket } from '@/server/services/ticket.service';
import {
  validationError,
  notFoundError,
  internalError,
  parseTicketId,
} from '@/server/lib/api-errors';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: RouteContext) {
  const { id: rawId } = await params;
  const id = parseTicketId(rawId);
  if (id === null) {
    return validationError('유효하지 않은 티켓 ID입니다');
  }

  try {
    const ticket = await completeTicket(id);
    if (!ticket) {
      return notFoundError();
    }
    return NextResponse.json(ticket, { status: 200 });
  } catch {
    return internalError();
  }
}
