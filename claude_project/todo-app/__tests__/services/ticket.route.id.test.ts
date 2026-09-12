/** @jest-environment node */

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  tickets: {},
}));

import { db } from '@/server/db';
import { GET, PATCH, DELETE } from '@/app/api/tickets/[id]/route';

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

function patchRequest(body: unknown) {
  return new Request('http://localhost/api/tickets/1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/tickets/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('존재하는 티켓을 200과 isOverdue 포함해서 반환한다', async () => {
    mockSelectSingle([row({ id: 1 })]);

    const response = await GET(new Request('http://localhost/api/tickets/1'), ctx('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe(1);
    expect(body).toHaveProperty('isOverdue');
  });

  it('없는 티켓이면 404, TICKET_NOT_FOUND', async () => {
    mockSelectSingle([]);

    const response = await GET(new Request('http://localhost/api/tickets/999'), ctx('999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' },
    });
  });

  it('id가 숫자가 아니면 400, VALIDATION_ERROR', async () => {
    const response = await GET(new Request('http://localhost/api/tickets/abc'), ctx('abc'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/tickets/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  function mockUpdateThenRefetch(updatedRow: Record<string, unknown> | undefined) {
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(updatedRow ? [updatedRow] : []),
        }),
      }),
    });
    mockSelectSingle(updatedRow ? [updatedRow] : []);
  }

  it('제목만 수정하면 200과 변경된 제목을 반환한다', async () => {
    mockUpdateThenRefetch(row({ id: 1, title: '새 제목' }));

    const response = await PATCH(patchRequest({ title: '새 제목' }), ctx('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.title).toBe('새 제목');
  });

  it('description: null이면 200과 description=null을 반환한다', async () => {
    mockUpdateThenRefetch(row({ id: 1, description: null }));

    const response = await PATCH(patchRequest({ description: null }), ctx('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.description).toBeNull();
  });

  it('없는 티켓이면 404, TICKET_NOT_FOUND', async () => {
    mockUpdateThenRefetch(undefined);

    const response = await PATCH(patchRequest({ title: '제목' }), ctx('999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('TICKET_NOT_FOUND');
  });

  it('제목 200자 초과면 400, VALIDATION_ERROR', async () => {
    const response = await PATCH(
      patchRequest({ title: 'a'.repeat(201) }),
      ctx('1')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe('제목은 200자 이내로 입력해주세요');
  });

  it('과거 종료예정일이면 400, VALIDATION_ERROR', async () => {
    const response = await PATCH(
      patchRequest({ dueDate: '2020-01-01' }),
      ctx('1')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe('종료예정일은 오늘 이후 날짜를 선택해주세요');
  });

  it('status 필드를 보내도 무시되고 저장 대상에 포함되지 않는다', async () => {
    const setMock = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([row({ id: 1 })]),
      }),
    });
    (db.update as jest.Mock).mockReturnValue({ set: setMock });
    mockSelectSingle([row({ id: 1 })]);

    await PATCH(patchRequest({ title: '제목', status: 'DONE' }), ctx('1'));

    const setArg = setMock.mock.calls[0][0];
    expect('status' in setArg).toBe(false);
  });
});

describe('DELETE /api/tickets/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  function mockDelete(rows: { id: number }[]) {
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue(rows),
      }),
    });
  }

  it('정상 삭제 시 204를 반환한다', async () => {
    mockDelete([{ id: 1 }]);

    const response = await DELETE(new Request('http://localhost/api/tickets/1'), ctx('1'));

    expect(response.status).toBe(204);
  });

  it('없는 티켓이면 404, TICKET_NOT_FOUND', async () => {
    mockDelete([]);

    const response = await DELETE(new Request('http://localhost/api/tickets/999'), ctx('999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('TICKET_NOT_FOUND');
  });
});
