/**
 * @jest-environment node
 *
 * docs/TEST_CASES.md § TC-API-006 (DELETE /api/tickets/:id — 티켓 삭제) 006-1 ~ 006-2
 */

jest.mock('@/server/db', () => ({
  db: { select: jest.fn(), delete: jest.fn() },
  tickets: {},
}));

import { db } from '@/server/db';
import { DELETE, GET } from '@/app/api/tickets/[id]/route';

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function mockDelete(rows: { id: number }[]) {
  (db.delete as jest.Mock).mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue(rows),
    }),
  });
}

function mockGetAfterDelete() {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    }),
  });
}

describe('TC-API-006: DELETE /api/tickets/:id — 티켓 삭제', () => {
  beforeEach(() => jest.clearAllMocks());

  it('006-1 정상 삭제 → 204, 재조회 시 404', async () => {
    mockDelete([{ id: 1 }]);
    const deleteResponse = await DELETE(new Request('http://localhost/api/tickets/1'), ctx('1'));
    expect(deleteResponse.status).toBe(204);

    mockGetAfterDelete();
    const getResponse = await GET(new Request('http://localhost/api/tickets/1'), ctx('1'));
    expect(getResponse.status).toBe(404);
  });

  it('006-2 없는 티켓 삭제 → 404, "티켓을 찾을 수 없습니다"', async () => {
    mockDelete([]);
    const response = await DELETE(new Request('http://localhost/api/tickets/999'), ctx('999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' },
    });
  });
});
