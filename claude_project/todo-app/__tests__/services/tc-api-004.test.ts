/**
 * @jest-environment node
 *
 * docs/TEST_CASES.md § TC-API-004 (PATCH /api/tickets/:id — 티켓 수정) 004-1 ~ 004-9
 */

jest.mock('@/server/db', () => ({
  db: { select: jest.fn(), update: jest.fn() },
  tickets: {},
}));

import { db } from '@/server/db';
import { PATCH } from '@/app/api/tickets/[id]/route';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: '기존 제목',
    description: '기존 설명',
    status: 'TODO',
    priority: 'MEDIUM',
    position: 1,
    plannedStartDate: '2026-02-01',
    dueDate: '2026-02-20',
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2026-02-01T09:00:00.000Z'),
    updatedAt: new Date('2026-02-01T09:00:00.000Z'),
    ...overrides,
  };
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patchRequest(body: unknown) {
  return new Request('http://localhost/api/tickets/1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Wires db.update(...).set(...).where(...).returning() and the PATCH
 * handler's follow-up db.select(...) refetch to the same resulting row. */
function mockUpdateAndRefetch(updatedRow: Record<string, unknown> | undefined) {
  const setMock = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue(updatedRow ? [updatedRow] : []),
    }),
  });
  (db.update as jest.Mock).mockReturnValue({ set: setMock });
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(updatedRow ? [updatedRow] : []),
    }),
  });
  return setMock;
}

describe('TC-API-004: PATCH /api/tickets/:id — 티켓 수정', () => {
  beforeEach(() => jest.clearAllMocks());

  it('004-1 제목만 수정 → 200, 제목 변경, 나머지 유지', async () => {
    mockUpdateAndRefetch(row({ title: '새 제목' }));
    const response = await PATCH(patchRequest({ title: '새 제목' }), ctx('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.title).toBe('새 제목');
    expect(body.description).toBe('기존 설명');
  });

  it('004-2 우선순위 변경 → 200, priority 변경', async () => {
    mockUpdateAndRefetch(row({ priority: 'LOW' }));
    const response = await PATCH(patchRequest({ priority: 'LOW' }), ctx('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.priority).toBe('LOW');
  });

  it('004-3 설명 삭제 → 200, description=null', async () => {
    mockUpdateAndRefetch(row({ description: null }));
    const response = await PATCH(patchRequest({ description: null }), ctx('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.description).toBeNull();
  });

  it('004-4 종료예정일 삭제 → 200, dueDate=null', async () => {
    mockUpdateAndRefetch(row({ dueDate: null }));
    const response = await PATCH(patchRequest({ dueDate: null }), ctx('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.dueDate).toBeNull();
  });

  it('004-5 시작예정일 수정 → 200, plannedStartDate 변경', async () => {
    mockUpdateAndRefetch(row({ plannedStartDate: '2026-03-01' }));
    const response = await PATCH(
      patchRequest({ plannedStartDate: '2026-03-01' }),
      ctx('1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.plannedStartDate).toBe('2026-03-01');
  });

  it('004-6 시작예정일 삭제 → 200, plannedStartDate=null', async () => {
    mockUpdateAndRefetch(row({ plannedStartDate: null }));
    const response = await PATCH(
      patchRequest({ plannedStartDate: null }),
      ctx('1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.plannedStartDate).toBeNull();
  });

  it('004-7 없는 티켓 수정 → 404, "티켓을 찾을 수 없습니다"', async () => {
    mockUpdateAndRefetch(undefined);
    const response = await PATCH(patchRequest({ title: '제목' }), ctx('999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' },
    });
  });

  it('004-8 updatedAt 갱신 확인 → 아무 필드 수정 시 updatedAt이 set 대상에 포함된다', async () => {
    const setMock = mockUpdateAndRefetch(row());
    await PATCH(patchRequest({ title: '제목' }), ctx('1'));

    const setArg = setMock.mock.calls[0][0];
    expect(setArg.updatedAt).toBeInstanceOf(Date);
  });

  it('004-9 status 수정 불가 → status를 보내도 무시된다(저장 대상에서 제외)', async () => {
    const setMock = mockUpdateAndRefetch(row({ status: 'TODO' }));
    const response = await PATCH(
      patchRequest({ title: '제목', status: 'DONE' }),
      ctx('1')
    );
    const body = await response.json();

    const setArg = setMock.mock.calls[0][0];
    expect('status' in setArg).toBe(false);
    expect(body.status).toBe('TODO');
  });
});
