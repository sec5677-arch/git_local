/** @jest-environment node */

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
  tickets: {},
}));

import { db } from '@/server/db';
import { PATCH } from '@/app/api/tickets/[id]/complete/route';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
    title: '제목',
    description: null,
    status: 'DONE',
    priority: 'MEDIUM',
    position: -1024,
    plannedStartDate: null,
    dueDate: null,
    startedAt: null,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function mockMinPosition(minPosition: number | null) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([{ minPosition }]),
    }),
  });
}

function mockUpdateResult(updatedRow: Record<string, unknown> | undefined) {
  (db.update as jest.Mock).mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue(updatedRow ? [updatedRow] : []),
      }),
    }),
  });
}

describe('PATCH /api/tickets/:id/complete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('정상 완료 처리 시 200, status=DONE, completedAt 설정', async () => {
    mockMinPosition(null);
    mockUpdateResult(row());

    const response = await PATCH(new Request('http://localhost/api/tickets/3/complete'), ctx('3'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('DONE');
    expect(body.completedAt).not.toBeNull();
  });

  it('없는 티켓이면 404, TICKET_NOT_FOUND', async () => {
    mockMinPosition(null);
    mockUpdateResult(undefined);

    const response = await PATCH(new Request('http://localhost/api/tickets/999/complete'), ctx('999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('TICKET_NOT_FOUND');
  });

  it('id가 숫자가 아니면 400, VALIDATION_ERROR', async () => {
    const response = await PATCH(new Request('http://localhost/api/tickets/abc/complete'), ctx('abc'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
