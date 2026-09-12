import { NextResponse } from 'next/server';
import { reorderTicketSchema } from '@/shared/validations/ticket';
import { reorderTicket } from '@/server/services/ticket.service';
import { validationError, notFoundError, internalError } from '@/server/lib/api-errors';

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationError('요청 본문이 올바른 JSON이 아닙니다');
  }

  const parsed = reorderTicketSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0].message);
  }

  try {
    const result = await reorderTicket(parsed.data);
    if (!result) {
      return notFoundError();
    }
    return NextResponse.json(result, { status: 200 });
  } catch {
    return internalError();
  }
}
