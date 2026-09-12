/** @jest-environment node */

jest.mock('@/server/db', () => ({
  db: {
    transaction: jest.fn(),
  },
  tickets: {},
}));

import { db } from '@/server/db';
import { PATCH } from '@/app/api/tickets/reorder/route';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
    title: '제목',
    description: null,
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    position: 0,
    plannedStartDate: null,
    dueDate: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function reorderRequest(body: unknown) {
  return new Request('http://localhost/api/tickets/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockTx(existingRow: Record<string, unknown> | undefined, updatedRow?: Record<string, unknown>) {
  let selectCallCount = 0;
  const tx = {
    select: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockImplementation(() => {
          selectCallCount += 1;
          if (selectCallCount === 1) {
            return Promise.resolve(existingRow ? [existingRow] : []);
          }
          return { orderBy: jest.fn().mockResolvedValue(updatedRow ? [updatedRow] : []) };
        }),
      }),
    })),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(updatedRow ? [updatedRow] : []),
        }),
      }),
    }),
  };
  (db.transaction as jest.Mock).mockImplementation((cb) => cb(tx));
  return tx;
}

describe('PATCH /api/tickets/reorder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('정상 이동: 200과 ticket, affected를 반환한다', async () => {
    const updatedRow = row({ id: 3, status: 'IN_PROGRESS', position: 0 });
    mockTx(row({ id: 3, status: 'TODO' }), updatedRow);

    const response = await PATCH(
      reorderRequest({ ticketId: 3, status: 'IN_PROGRESS', position: 0 })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ticket.status).toBe('IN_PROGRESS');
    expect(body.affected).toEqual([]);
  });

  it('status로 DONE을 보내면 400, VALIDATION_ERROR', async () => {
    const response = await PATCH(
      reorderRequest({ ticketId: 3, status: 'DONE', position: 0 })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: '상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요',
      },
    });
  });

  it('잘못된 status 값이면 400, VALIDATION_ERROR', async () => {
    const response = await PATCH(
      reorderRequest({ ticketId: 3, status: 'INVALID', position: 0 })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe('상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요');
  });

  it('없는 ticketId면 404, TICKET_NOT_FOUND', async () => {
    mockTx(undefined);

    const response = await PATCH(
      reorderRequest({ ticketId: 999, status: 'TODO', position: 0 })
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('TICKET_NOT_FOUND');
  });
});
