/** @jest-environment node */

jest.mock('@/server/db', () => ({
  db: {
    transaction: jest.fn(),
  },
  tickets: {},
}));

import { db } from '@/server/db';
import { reorderTicket } from '@/server/services/ticket.service';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: '제목',
    description: null,
    status: 'BACKLOG',
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

/**
 * The service does two `select` queries inside the transaction:
 * 1. `select().from().where()` (awaited directly) — load the target ticket.
 * 2. `select().from().where().orderBy()` — re-read the destination column.
 * This fake `tx` returns a plain Promise for the first call and a
 * `{ orderBy }`-shaped object for the second, matching that exact usage.
 */
function mockTx(options: {
  existingRow: Record<string, unknown> | undefined;
  updatedRow?: Record<string, unknown>;
  columnRows?: Record<string, unknown>[];
}) {
  const { existingRow, updatedRow, columnRows = [] } = options;
  let selectCallCount = 0;

  const tx = {
    select: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockImplementation(() => {
          selectCallCount += 1;
          if (selectCallCount === 1) {
            return Promise.resolve(existingRow ? [existingRow] : []);
          }
          return {
            orderBy: jest.fn().mockResolvedValue(columnRows),
          };
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

  (db.transaction as jest.Mock).mockImplementation((callback) => callback(tx));
  return tx;
}

describe('reorderTicket', () => {
  beforeEach(() => jest.clearAllMocks());

  it('존재하지 않는 티켓이면 null을 반환한다', async () => {
    mockTx({ existingRow: undefined });

    const result = await reorderTicket({
      ticketId: 999,
      status: 'TODO',
      position: 0,
    });

    expect(result).toBeNull();
  });

  it('대상 티켓의 status와 position을 동시에 업데이트한다', async () => {
    const updatedRow = row({ id: 3, status: 'IN_PROGRESS', position: 0 });
    mockTx({
      existingRow: row({ id: 3, status: 'TODO', position: 5 }),
      updatedRow,
      columnRows: [updatedRow],
    });

    const result = await reorderTicket({
      ticketId: 3,
      status: 'IN_PROGRESS',
      position: 0,
    });

    expect(result?.ticket.status).toBe('IN_PROGRESS');
    expect(result?.ticket.position).toBe(0);
  });

  it('TODO로 이동하면 startedAt이 현재 시각으로 설정된다', async () => {
    const updatedRow = row({ id: 1, status: 'TODO', startedAt: new Date() });
    const tx = mockTx({
      existingRow: row({ id: 1, status: 'BACKLOG' }),
      updatedRow,
      columnRows: [updatedRow],
    });

    await reorderTicket({ ticketId: 1, status: 'TODO', position: 0 });

    const setCall = (tx.update as jest.Mock).mock.results[0].value.set.mock
      .calls[0][0];
    expect(setCall.startedAt).toBeInstanceOf(Date);
  });

  it('TODO에서 BACKLOG로 이동하면 startedAt이 null로 초기화된다', async () => {
    const updatedRow = row({ id: 1, status: 'BACKLOG', startedAt: null });
    const tx = mockTx({
      existingRow: row({ id: 1, status: 'TODO', startedAt: new Date() }),
      updatedRow,
      columnRows: [updatedRow],
    });

    await reorderTicket({ ticketId: 1, status: 'BACKLOG', position: 0 });

    const setCall = (tx.update as jest.Mock).mock.results[0].value.set.mock
      .calls[0][0];
    expect(setCall.startedAt).toBeNull();
  });

  it('그 외 이동은 startedAt 필드를 업데이트 대상에서 제외한다 (BACKLOG -> IN_PROGRESS)', async () => {
    const updatedRow = row({ id: 1, status: 'IN_PROGRESS' });
    const tx = mockTx({
      existingRow: row({ id: 1, status: 'BACKLOG' }),
      updatedRow,
      columnRows: [updatedRow],
    });

    await reorderTicket({ ticketId: 1, status: 'IN_PROGRESS', position: 0 });

    const setCall = (tx.update as jest.Mock).mock.results[0].value.set.mock
      .calls[0][0];
    expect('startedAt' in setCall).toBe(false);
  });

  it('Done에서 다른 칼럼으로 이동하면 completedAt이 null로 설정된다', async () => {
    const updatedRow = row({ id: 1, status: 'TODO', completedAt: null });
    const tx = mockTx({
      existingRow: row({ id: 1, status: 'DONE', completedAt: new Date() }),
      updatedRow,
      columnRows: [updatedRow],
    });

    await reorderTicket({ ticketId: 1, status: 'TODO', position: 0 });

    const setCall = (tx.update as jest.Mock).mock.results[0].value.set.mock
      .calls[0][0];
    expect(setCall.completedAt).toBeNull();
  });

  it('대상 칼럼에 position 중복이 없으면 affected는 비어있다', async () => {
    const updatedRow = row({ id: 1, status: 'TODO', position: 0 });
    mockTx({
      existingRow: row({ id: 1, status: 'BACKLOG' }),
      updatedRow,
      columnRows: [updatedRow, row({ id: 2, status: 'TODO', position: 1024 })],
    });

    const result = await reorderTicket({
      ticketId: 1,
      status: 'TODO',
      position: 0,
    });

    expect(result?.affected).toEqual([]);
  });

  it('대상 칼럼에 position이 중복되면 전체를 1024 간격으로 재정렬하고 다른 티켓을 affected로 반환한다', async () => {
    const updatedRow = row({ id: 3, status: 'IN_PROGRESS', position: 0 });
    mockTx({
      existingRow: row({ id: 3, status: 'TODO' }),
      updatedRow,
      // duplicate position (0) with ticket id 5 triggers rebalance
      columnRows: [
        updatedRow,
        row({ id: 5, status: 'IN_PROGRESS', position: 0 }),
        row({ id: 8, status: 'IN_PROGRESS', position: 1 }),
      ],
    });

    const result = await reorderTicket({
      ticketId: 3,
      status: 'IN_PROGRESS',
      position: 0,
    });

    expect(result?.ticket.position).toBe(1024);
    expect(result?.affected).toEqual(
      expect.arrayContaining([
        { id: 5, position: 2048 },
        { id: 8, position: 3072 },
      ])
    );
    expect(result?.affected).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 3 })])
    );
  });
});
