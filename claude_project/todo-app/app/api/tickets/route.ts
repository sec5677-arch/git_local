import { NextResponse } from 'next/server';
import { createTicketSchema } from '@/shared/validations/ticket';
import { createTicket, getBoard } from '@/server/services/ticket.service';
import { validationError, internalError } from '@/server/lib/api-errors';

export async function GET() {
  try {
    const boardResponse = await getBoard();
    return NextResponse.json(boardResponse, { status: 200 });
  } catch {
    return internalError();
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationError('요청 본문이 올바른 JSON이 아닙니다');
  }

  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0].message);
  }

  try {
    const ticket = await createTicket(parsed.data);
    return NextResponse.json(ticket, { status: 201 });
  } catch {
    return internalError();
  }
}
