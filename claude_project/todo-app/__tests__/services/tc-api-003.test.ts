/**
 * @jest-environment node
 *
 * docs/TEST_CASES.md § TC-API-003 (GET /api/tickets/:id — 티켓 상세 조회) 003-1 ~ 003-4
 */

jest.mock('@/server/db', () => ({
  db: { select: jest.fn() },
  tickets: {},
}));

import { db } from '@/server/db';
import { GET } from '@/app/api/tickets/[id]/route';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'API 설계 문서 작성',
    description: 'REST API 엔드포인트와 요청/응답 형식을 정의한다',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    position: 1,
    plannedStartDate: '2026-02-10',
    dueDate: '2026-02-15',
    startedAt: new Date('2026-01-28T00:00:00.000Z'),
    completedAt: null,
    createdAt: new Date('2026-02-01T09:00:00.000Z'),
    updatedAt: new Date('2026-02-01T09:00:00.000Z'),
    ...overrides,
  };
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function mockSelectSingle(rows: unknown[]) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(rows),
    }),
  });
}

describe('TC-API-003: GET /api/tickets/:id — 티켓 상세 조회', () => {
  beforeEach(() => jest.clearAllMocks());

  it('003-1 존재하는 티켓 → 200, 티켓 전체 데이터(모든 필드 포함)', async () => {
    mockSelectSingle([row()]);
    const response = await GET(new Request('http://localhost/api/tickets/1'), ctx('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    for (const key of [
      'id', 'title', 'description', 'status', 'priority', 'position',
      'plannedStartDate', 'dueDate', 'startedAt', 'completedAt',
      'createdAt', 'updatedAt',
    ]) {
      expect(body).toHaveProperty(key);
    }
  });

  it('003-2 없는 티켓 → 404, "티켓을 찾을 수 없습니다"', async () => {
    mockSelectSingle([]);
    const response = await GET(new Request('http://localhost/api/tickets/999'), ctx('999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' },
    });
  });

  it('003-3 잘못된 id 형식("abc") → 400, VALIDATION_ERROR', async () => {
    const response = await GET(new Request('http://localhost/api/tickets/abc'), ctx('abc'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('003-4 isOverdue 포함 → 정상 조회 시 파생 필드 포함', async () => {
    mockSelectSingle([row({ dueDate: '2020-01-01', status: 'TODO' })]);
    const response = await GET(new Request('http://localhost/api/tickets/1'), ctx('1'));
    const body = await response.json();

    expect(body).toHaveProperty('isOverdue');
    expect(body.isOverdue).toBe(true);
  });
});
