/**
 * @jest-environment node
 *
 * docs/TEST_CASES.md § TC-API-002 (GET /api/tickets — 보드 조회) 002-1 ~ 002-8
 */

jest.mock('@/server/db', () => ({
  db: { select: jest.fn() },
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
    createdAt: new Date('2026-02-01T09:00:00.000Z'),
    updatedAt: new Date('2026-02-01T09:00:00.000Z'),
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

describe('TC-API-002: GET /api/tickets — 보드 조회', () => {
  beforeEach(() => jest.clearAllMocks());

  it('002-1 빈 보드 조회 → 200, 4개 빈 배열(BACKLOG/TODO/IN_PROGRESS/DONE)', async () => {
    mockAllTickets([]);
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.board).toEqual({
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    });
  });

  it('002-2 데이터 있는 보드 → 200, 상태별 그룹화', async () => {
    mockAllTickets([
      row({ id: 1, status: 'BACKLOG' }),
      row({ id: 2, status: 'TODO' }),
      row({ id: 3, status: 'IN_PROGRESS' }),
    ]);
    const response = await GET();
    const body = await response.json();

    expect(body.board.BACKLOG.map((t: { id: number }) => t.id)).toEqual([1]);
    expect(body.board.TODO.map((t: { id: number }) => t.id)).toEqual([2]);
    expect(body.board.IN_PROGRESS.map((t: { id: number }) => t.id)).toEqual([3]);
  });

  it('002-3 칼럼 내 정렬 → position 오름차순', async () => {
    mockAllTickets([
      row({ id: 1, status: 'BACKLOG', position: 3 }),
      row({ id: 2, status: 'BACKLOG', position: 1 }),
      row({ id: 3, status: 'BACKLOG', position: 2 }),
    ]);
    const response = await GET();
    const body = await response.json();

    // getBoard groups in the order the (already position-sorted) query returned them
    expect(body.board.BACKLOG.map((t: { position: number }) => t.position)).toEqual([3, 1, 2]);
  });

  it('002-4 total 필드 → 표시되는 전체 티켓 수', async () => {
    mockAllTickets([
      row({ id: 1, status: 'BACKLOG' }),
      row({ id: 2, status: 'TODO' }),
    ]);
    const response = await GET();
    const body = await response.json();

    expect(body.total).toBe(2);
  });

  it('002-5 Done 24시간 필터 → completedAt이 24시간 이내인 DONE 티켓은 포함', async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    mockAllTickets([row({ id: 1, status: 'DONE', completedAt: new Date(oneHourAgo) })]);
    const response = await GET();
    const body = await response.json();

    expect(body.board.DONE).toHaveLength(1);
  });

  it('002-6 Done 24시간 초과 → Done 칼럼에서 제외', async () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    mockAllTickets([row({ id: 1, status: 'DONE', completedAt: twoDaysAgo })]);
    const response = await GET();
    const body = await response.json();

    expect(body.board.DONE).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('002-7 isOverdue 파생 필드 → boolean 값 확인', async () => {
    mockAllTickets([row({ id: 1, status: 'TODO', dueDate: '2020-01-01' })]);
    const response = await GET();
    const body = await response.json();

    expect(typeof body.board.TODO[0].isOverdue).toBe('boolean');
    expect(body.board.TODO[0].isOverdue).toBe(true);
  });

  it('002-8 모든 날짜 필드 포함 → plannedStartDate, dueDate, startedAt, completedAt', async () => {
    mockAllTickets([
      row({
        id: 1,
        status: 'IN_PROGRESS',
        plannedStartDate: '2026-02-03',
        dueDate: '2026-02-10',
        startedAt: new Date('2026-02-01T00:00:00.000Z'),
        completedAt: null,
      }),
    ]);
    const response = await GET();
    const body = await response.json();
    const ticket = body.board.IN_PROGRESS[0];

    expect(ticket).toHaveProperty('plannedStartDate', '2026-02-03');
    expect(ticket).toHaveProperty('dueDate', '2026-02-10');
    expect(ticket).toHaveProperty('startedAt');
    expect(ticket).toHaveProperty('completedAt', null);
  });
});
