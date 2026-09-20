import {
  getBoard,
  createTicket,
  updateTicket,
  deleteTicket,
  completeTicket,
  reorderTicket,
} from '@/client/api/ticketApi';
import type { BoardResponse, Ticket, ReorderResult } from '@/shared/types/ticket';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function noBodyResponse(status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new Error('204 응답에서는 json()이 호출되면 안 된다');
    },
  } as unknown as Response;
}

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

const now = new Date();

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 1,
    title: '제목',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    position: 1,
    plannedStartDate: null,
    dueDate: null,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('ticketApi', () => {
  describe('getBoard', () => {
    it('GET /api/tickets로 fetch를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, { board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] }, total: 0 })
      );
      await getBoard();
      expect(mockFetch).toHaveBeenCalledWith('/api/tickets', { method: 'GET' });
    });

    it('성공 응답이면 파싱된 보드 데이터를 반환한다', async () => {
      const body: BoardResponse = {
        board: { BACKLOG: [{ ...ticket(), isOverdue: false }], TODO: [], IN_PROGRESS: [], DONE: [] },
        total: 1,
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, body));
      await expect(getBoard()).resolves.toEqual(body);
    });

    it('에러 응답이면 error.message를 담아 throw한다', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(500, { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류' } })
      );
      await expect(getBoard()).rejects.toThrow('서버 내부 오류');
    });
  });

  describe('createTicket', () => {
    const input = { title: '새 업무', priority: 'HIGH' as const };

    it('POST /api/tickets로 body와 Content-Type 헤더를 담아 fetch를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(201, ticket({ title: '새 업무', priority: 'HIGH' })));
      await createTicket(input);
      expect(mockFetch).toHaveBeenCalledWith('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    });

    it('성공 응답(201)이면 생성된 티켓을 반환한다', async () => {
      const created = ticket({ id: 42, title: '새 업무', priority: 'HIGH' });
      mockFetch.mockResolvedValueOnce(jsonResponse(201, created));
      await expect(createTicket(input)).resolves.toEqual(created);
    });

    it('에러 응답(400)이면 error.message를 담아 throw한다', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(400, { error: { code: 'VALIDATION_ERROR', message: '제목을 입력해주세요' } })
      );
      await expect(createTicket(input)).rejects.toThrow('제목을 입력해주세요');
    });
  });

  describe('updateTicket', () => {
    const input = { title: '수정된 제목' };

    it('PATCH /api/tickets/:id로 body와 Content-Type 헤더를 담아 fetch를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, ticket({ id: 5, title: '수정된 제목' })));
      await updateTicket(5, input);
      expect(mockFetch).toHaveBeenCalledWith('/api/tickets/5', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    });

    it('성공 응답이면 수정된 티켓을 반환한다', async () => {
      const updated = ticket({ id: 5, title: '수정된 제목' });
      mockFetch.mockResolvedValueOnce(jsonResponse(200, updated));
      await expect(updateTicket(5, input)).resolves.toEqual(updated);
    });

    it('에러 응답(404)이면 error.message를 담아 throw한다', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(404, { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } })
      );
      await expect(updateTicket(999, input)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });

  describe('deleteTicket', () => {
    it('DELETE /api/tickets/:id로 fetch를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce(noBodyResponse(204));
      await deleteTicket(5);
      expect(mockFetch).toHaveBeenCalledWith('/api/tickets/5', { method: 'DELETE' });
    });

    it('성공 응답(204)이면 body 없이 resolve한다', async () => {
      mockFetch.mockResolvedValueOnce(noBodyResponse(204));
      await expect(deleteTicket(5)).resolves.toBeUndefined();
    });

    it('에러 응답(404)이면 error.message를 담아 throw한다', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(404, { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } })
      );
      await expect(deleteTicket(999)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });

  describe('completeTicket', () => {
    it('PATCH /api/tickets/:id/complete로 fetch를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, ticket({ id: 5, status: 'DONE' })));
      await completeTicket(5);
      expect(mockFetch).toHaveBeenCalledWith('/api/tickets/5/complete', { method: 'PATCH' });
    });

    it('성공 응답이면 완료된 티켓을 반환한다', async () => {
      const completed = ticket({ id: 5, status: 'DONE', completedAt: now });
      mockFetch.mockResolvedValueOnce(jsonResponse(200, completed));
      await expect(completeTicket(5)).resolves.toEqual(completed);
    });

    it('에러 응답(404)이면 error.message를 담아 throw한다', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(404, { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } })
      );
      await expect(completeTicket(999)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });

  describe('reorderTicket', () => {
    it('PATCH /api/tickets/reorder로 body와 Content-Type 헤더를 담아 fetch를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, { ticket: ticket({ id: 3, status: 'IN_PROGRESS', position: 0 }), affected: [] })
      );
      await reorderTicket(3, 'IN_PROGRESS', 0);
      expect(mockFetch).toHaveBeenCalledWith('/api/tickets/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: 3, status: 'IN_PROGRESS', position: 0 }),
      });
    });

    it('성공 응답이면 ticket과 affected를 반환한다', async () => {
      const result: ReorderResult = {
        ticket: ticket({ id: 3, status: 'IN_PROGRESS', position: 0 }),
        affected: [{ id: 7, position: 1024 }],
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, result));
      await expect(reorderTicket(3, 'IN_PROGRESS', 0)).resolves.toEqual(result);
    });

    it('에러 응답(400)이면 error.message를 담아 throw한다', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(400, {
          error: { code: 'VALIDATION_ERROR', message: '상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요' },
        })
      );
      await expect(reorderTicket(3, 'IN_PROGRESS', 0)).rejects.toThrow(
        '상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요'
      );
    });
  });
});
