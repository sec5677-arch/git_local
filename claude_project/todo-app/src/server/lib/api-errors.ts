import { NextResponse } from 'next/server';

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function validationError(message: string) {
  return errorResponse(400, 'VALIDATION_ERROR', message);
}

export function notFoundError(message = '티켓을 찾을 수 없습니다') {
  return errorResponse(404, 'TICKET_NOT_FOUND', message);
}

export function internalError(message = '서버 내부 오류가 발생했습니다') {
  return errorResponse(500, 'INTERNAL_ERROR', message);
}

/** Parses a route `[id]` param; returns null if it is not a positive integer. */
export function parseTicketId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
