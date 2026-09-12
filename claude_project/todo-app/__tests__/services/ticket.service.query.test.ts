/** @jest-environment node */

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
  },
  tickets: {},
}));

import { db } from '@/server/db';
import { getBoard, getTicketById } from '@/server/services/ticket.service';

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

function mockSelectAll(rows: unknown[]) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      orderBy: jest.fn().mockResolvedValue(rows),
      where: jest.fn().mockResolvedValue(rows),
    }),
  });
}

describe('getBoard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('4개 칼럼으로 그룹화하고 각 칼럼 내 position 오름차순을 유지한다', async () => {
    mockSelectAll([
      row({ id: 1, status: 'BACKLOG', position: 1 }),
      row({ id: 2, status: 'TODO', position: 1 }),
      row({ id: 3, status: 'BACKLOG', position: 2 }),
    ]);

    const { board, total } = await getBoard();

    expect(board.BACKLOG.map((t) => t.id)).toEqual([1, 3]);
    expect(board.TODO.map((t) => t.id)).toEqual([2]);
    expect(board.IN_PROGRESS).toEqual([]);
    expect(board.DONE).toEqual([]);
    expect(total).toBe(3);
  });

  it('dueDate가 오늘보다 이전이고 status가 DONE이 아니면 isOverdue=true이다', async () => {
    mockSelectAll([
      row({ id: 1, status: 'TODO', dueDate: '2020-01-01' }),
    ]);

    const { board } = await getBoard();

    expect(board.TODO[0].isOverdue).toBe(true);
  });

  it('status가 DONE이면 dueDate가 과거여도 isOverdue=false이다', async () => {
    mockSelectAll([
      row({
        id: 1,
        status: 'DONE',
        dueDate: '2020-01-01',
        completedAt: new Date(),
      }),
    ]);

    const { board } = await getBoard();

    expect(board.DONE[0].isOverdue).toBe(false);
  });

  it('dueDate가 없으면 isOverdue=false이다', async () => {
    mockSelectAll([row({ id: 1, status: 'TODO', dueDate: null })]);

    const { board } = await getBoard();

    expect(board.TODO[0].isOverdue).toBe(false);
  });

  it('completedAt이 24시간 이내인 DONE 티켓은 포함된다', async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    mockSelectAll([row({ id: 1, status: 'DONE', completedAt: oneHourAgo })]);

    const { board, total } = await getBoard();

    expect(board.DONE).toHaveLength(1);
    expect(total).toBe(1);
  });

  it('completedAt이 24시간을 초과한 DONE 티켓은 제외된다', async () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    mockSelectAll([row({ id: 1, status: 'DONE', completedAt: twoDaysAgo })]);

    const { board, total } = await getBoard();

    expect(board.DONE).toHaveLength(0);
    expect(total).toBe(0);
  });
});

describe('getTicketById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('존재하는 티켓을 isOverdue와 함께 반환한다', async () => {
    mockSelectAll([row({ id: 1, status: 'IN_PROGRESS', dueDate: null })]);

    const result = await getTicketById(1);

    expect(result?.id).toBe(1);
    expect(result?.isOverdue).toBe(false);
  });

  it('존재하지 않는 티켓이면 null을 반환한다', async () => {
    mockSelectAll([]);

    const result = await getTicketById(999);

    expect(result).toBeNull();
  });
});
