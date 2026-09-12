/**
 * @jest-environment node
 *
 * docs/TEST_CASES.md § TC-API-005 (PATCH /api/tickets/:id/complete — 티켓 완료) 005-1 ~ 005-5
 */

jest.mock('@/server/db', () => ({
  db: { select: jest.fn(), update: jest.fn() },
  tickets: {},
}));

import { db } from '@/server/db';
import { PATCH } from '@/app/api/tickets/[id]/complete/route';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
    title: 'API 설계 문서 작성',
    description: null,
    status: 'DONE',
    priority: 'HIGH',
    position: -1024,
    plannedStartDate: '2026-02-10',
    dueDate: '2026-02-15',
    startedAt: new Date('2026-01-28T00:00:00.000Z'),
    completedAt: new Date(),
    createdAt: new Date('2026-02-01T09:00:00.000Z'),
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
  const setMock = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue(updatedRow ? [updatedRow] : []),
    }),
  });
  (db.update as jest.Mock).mockReturnValue({ set: setMock });
  return setMock;
}

describe('TC-API-005: PATCH /api/tickets/:id/complete — 티켓 완료', () => {
  beforeEach(() => jest.clearAllMocks());

  it('005-1 정상 완료 처리 → 200, status=DONE, completedAt 설정', async () => {
    mockMinPosition(null);
    mockUpdateResult(row());
    const response = await PATCH(new Request('http://localhost/api/tickets/3/complete'), ctx('3'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('DONE');
    expect(body.completedAt).not.toBeNull();
  });

  it('005-2 completedAt 자동 설정 → 현재 시각에 근접', async () => {
    mockMinPosition(null);
    const setMock = mockUpdateResult(row());
    const before = Date.now();

    await PATCH(new Request('http://localhost/api/tickets/3/complete'), ctx('3'));

    const setArg = setMock.mock.calls[0][0];
    expect(setArg.completedAt).toBeInstanceOf(Date);
    expect(Math.abs(setArg.completedAt.getTime() - before)).toBeLessThan(5000);
  });

  it('005-3 position 할당 → Done 칼럼 맨 위 position (min - 1024)', async () => {
    mockMinPosition(-1024);
    const setMock = mockUpdateResult(row());

    await PATCH(new Request('http://localhost/api/tickets/3/complete'), ctx('3'));

    expect(setMock.mock.calls[0][0].position).toBe(-2048);
  });

  it('005-4 없는 티켓 완료 → 404, "티켓을 찾을 수 없습니다"', async () => {
    mockMinPosition(null);
    mockUpdateResult(undefined);
    const response = await PATCH(new Request('http://localhost/api/tickets/999/complete'), ctx('999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' },
    });
  });

  it('005-5 updatedAt 갱신 확인 → 완료 처리 시 updatedAt이 set 대상에 포함된다', async () => {
    mockMinPosition(null);
    const setMock = mockUpdateResult(row());

    await PATCH(new Request('http://localhost/api/tickets/3/complete'), ctx('3'));

    expect(setMock.mock.calls[0][0].updatedAt).toBeInstanceOf(Date);
  });
});
