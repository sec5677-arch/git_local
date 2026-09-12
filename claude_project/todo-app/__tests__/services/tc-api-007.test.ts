/**
 * @jest-environment node
 *
 * docs/TEST_CASES.md § TC-API-007 (PATCH /api/tickets/reorder) 007-1 ~ 007-12
 *
 * NOTE (007-6): docs/API_SPEC.md's "비즈니스 로직 (startedAt)" rule is
 * exhaustive — "TODO로 이동 시" sets startedAt, "TODO에서 BACKLOG로 이동 시"
 * clears it, "그 외 이동" (everything else) leaves it unchanged. DONE→BACKLOG
 * falls under "그 외" per that literal rule, so this implementation does NOT
 * clear startedAt for it — only completedAt. TEST_CASES.md 007-6 expects
 * startedAt=null too. This is a spec/test-case inconsistency; the test below
 * asserts the current (API_SPEC.md-literal) behavior and documents the
 * conflict rather than silently resolving it either way.
 */

jest.mock('@/server/db', () => ({
  db: { transaction: jest.fn() },
  tickets: {},
}));

import { db } from '@/server/db';
import { PATCH } from '@/app/api/tickets/reorder/route';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
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

function reorderRequest(body: unknown) {
  return new Request('http://localhost/api/tickets/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockTx(
  existingRow: Record<string, unknown> | undefined,
  updatedRow?: Record<string, unknown>,
  columnRows?: Record<string, unknown>[]
) {
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
            orderBy: jest
              .fn()
              .mockResolvedValue(columnRows ?? (updatedRow ? [updatedRow] : [])),
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
  (db.transaction as jest.Mock).mockImplementation((cb) => cb(tx));
  return tx;
}

function lastSetCallOn(tx: ReturnType<typeof mockTx>, callIndex = 0) {
  return (tx.update as jest.Mock).mock.results[callIndex].value.set.mock.calls[0][0];
}

describe('TC-API-007: PATCH /api/tickets/reorder — 상태/순서 변경', () => {
  beforeEach(() => jest.clearAllMocks());

  it('007-1 칼럼 간 이동 (BACKLOG→TODO) → status=TODO, position 갱신', async () => {
    const updatedRow = row({ id: 3, status: 'TODO', position: 0 });
    mockTx(row({ id: 3, status: 'BACKLOG' }), updatedRow);

    const response = await PATCH(
      reorderRequest({ ticketId: 3, status: 'TODO', position: 0 })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ticket.status).toBe('TODO');
    expect(body.ticket.position).toBe(0);
  });

  it('007-2 같은 칼럼 내 순서 변경 → position만 변경, status 유지', async () => {
    const updatedRow = row({ id: 3, status: 'TODO', position: 512 });
    const tx = mockTx(row({ id: 3, status: 'TODO', position: 1024 }), updatedRow);

    await PATCH(reorderRequest({ ticketId: 3, status: 'TODO', position: 512 }));

    const setArg = lastSetCallOn(tx);
    expect(setArg.status).toBe('TODO');
    expect(setArg.position).toBe(512);
    // moving within the same column must not touch startedAt/completedAt
    expect('startedAt' in setArg).toBe(false);
  });

  it('007-3 TODO 이동 시 startedAt 설정 → 현재 시각', async () => {
    const updatedRow = row({ id: 3, status: 'TODO' });
    const tx = mockTx(row({ id: 3, status: 'BACKLOG' }), updatedRow);

    await PATCH(reorderRequest({ ticketId: 3, status: 'TODO', position: 0 }));

    expect(lastSetCallOn(tx).startedAt).toBeInstanceOf(Date);
  });

  it('007-4 BACKLOG 복귀 시 startedAt 초기화 → TODO → BACKLOG', async () => {
    const updatedRow = row({ id: 3, status: 'BACKLOG' });
    const tx = mockTx(
      row({ id: 3, status: 'TODO', startedAt: new Date() }),
      updatedRow
    );

    await PATCH(reorderRequest({ ticketId: 3, status: 'BACKLOG', position: 0 }));

    expect(lastSetCallOn(tx).startedAt).toBeNull();
  });

  it('007-5 Done에서 나가기 (DONE → TODO) → completedAt=null, startedAt 설정', async () => {
    const updatedRow = row({ id: 3, status: 'TODO' });
    const tx = mockTx(
      row({ id: 3, status: 'DONE', completedAt: new Date() }),
      updatedRow
    );

    await PATCH(reorderRequest({ ticketId: 3, status: 'TODO', position: 0 }));

    const setArg = lastSetCallOn(tx);
    expect(setArg.completedAt).toBeNull();
    expect(setArg.startedAt).toBeInstanceOf(Date);
  });

  it('007-6 [스펙 불일치 발견] Done에서 BACKLOG로 → completedAt=null (startedAt은 API_SPEC.md 규칙상 변경 없음; TEST_CASES.md는 null도 기대함)', async () => {
    const updatedRow = row({ id: 3, status: 'BACKLOG' });
    const tx = mockTx(
      row({ id: 3, status: 'DONE', completedAt: new Date(), startedAt: new Date('2026-01-01') }),
      updatedRow
    );

    await PATCH(reorderRequest({ ticketId: 3, status: 'BACKLOG', position: 0 }));

    const setArg = lastSetCallOn(tx);
    expect(setArg.completedAt).toBeNull();
    // Current (API_SPEC.md-literal) behavior: startedAt is untouched here.
    expect('startedAt' in setArg).toBe(false);
  });

  it('007-7 TODO → IN_PROGRESS 이동 시 startedAt 유지 (변경 없음)', async () => {
    const updatedRow = row({ id: 3, status: 'IN_PROGRESS' });
    const tx = mockTx(
      row({ id: 3, status: 'TODO', startedAt: new Date('2026-01-01') }),
      updatedRow
    );

    await PATCH(reorderRequest({ ticketId: 3, status: 'IN_PROGRESS', position: 0 }));

    expect('startedAt' in lastSetCallOn(tx)).toBe(false);
  });

  it('007-8 다른 티켓 position 영향 → affected 배열에 영향받는 티켓 포함', async () => {
    const updatedRow = row({ id: 3, status: 'IN_PROGRESS', position: 0 });
    mockTx(row({ id: 3, status: 'TODO' }), updatedRow, [
      updatedRow,
      row({ id: 5, status: 'IN_PROGRESS', position: 0 }),
      row({ id: 8, status: 'IN_PROGRESS', position: 1 }),
    ]);

    const response = await PATCH(
      reorderRequest({ ticketId: 3, status: 'IN_PROGRESS', position: 0 })
    );
    const body = await response.json();

    expect(body.affected).toEqual(
      expect.arrayContaining([
        { id: 5, position: 2048 },
        { id: 8, position: 3072 },
      ])
    );
  });

  it('007-9 DONE을 status로 전송 → 400, VALIDATION_ERROR', async () => {
    const response = await PATCH(
      reorderRequest({ ticketId: 3, status: 'DONE', position: 0 })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('007-10 잘못된 status → 400, "상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요"', async () => {
    const response = await PATCH(
      reorderRequest({ ticketId: 3, status: 'INVALID', position: 0 })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe('상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요');
  });

  it('007-11 없는 티켓 이동 → 404, "티켓을 찾을 수 없습니다"', async () => {
    mockTx(undefined);
    const response = await PATCH(
      reorderRequest({ ticketId: 999, status: 'TODO', position: 0 })
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' },
    });
  });

  it('007-12 updatedAt 갱신 확인 → 정상 이동 시 updatedAt이 set 대상에 포함된다', async () => {
    const updatedRow = row({ id: 3, status: 'TODO' });
    const tx = mockTx(row({ id: 3, status: 'BACKLOG' }), updatedRow);

    await PATCH(reorderRequest({ ticketId: 3, status: 'TODO', position: 0 }));

    expect(lastSetCallOn(tx).updatedAt).toBeInstanceOf(Date);
  });
});
