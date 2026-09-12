/** @jest-environment node */

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
  },
  tickets: {},
}));

import { db } from '@/server/db';
import { GET } from '@/app/api/tickets/route';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: '제목',
    description: null,
    status: 'BACKLOG',
    priority: 'MEDIUM',
    position: 1,
    plannedStartDate: null,
    dueDate: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function mockAllTickets(rows: unknown[]) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      orderBy: jest.fn().mockResolvedValue(rows),
    }),
  });
}

describe('GET /api/tickets', () => {
  beforeEach(() => jest.clearAllMocks());

  it('빈 보드는 200과 4개 빈 배열을 반환한다', async () => {
    mockAllTickets([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] },
      total: 0,
    });
  });

  it('상태별로 그룹화하고 total을 계산한다', async () => {
    mockAllTickets([
      row({ id: 1, status: 'BACKLOG' }),
      row({ id: 2, status: 'TODO' }),
      row({ id: 3, status: 'BACKLOG' }),
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.board.BACKLOG).toHaveLength(2);
    expect(body.board.TODO).toHaveLength(1);
    expect(body.total).toBe(3);
  });

  it('각 티켓에 isOverdue 파생 필드를 포함한다', async () => {
    mockAllTickets([row({ id: 1, status: 'TODO', dueDate: '2020-01-01' })]);

    const response = await GET();
    const body = await response.json();

    expect(body.board.TODO[0].isOverdue).toBe(true);
  });
});
