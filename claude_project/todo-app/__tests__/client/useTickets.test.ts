import { renderHook, act } from '@testing-library/react';
import type { Board, Ticket } from '@/shared/types/ticket';

jest.mock('@/client/api/ticketApi', () => ({
  getBoard: jest.fn(),
  createTicket: jest.fn(),
  updateTicket: jest.fn(),
  deleteTicket: jest.fn(),
  completeTicket: jest.fn(),
  reorderTicket: jest.fn(),
}));

import * as ticketApi from '@/client/api/ticketApi';
import { useTickets } from '@/client/hooks/useTickets';

const mockedTicketApi = ticketApi as jest.Mocked<typeof ticketApi>;

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

function withOverdue(t: Ticket) {
  return { ...t, isOverdue: false };
}

function board(overrides: Partial<Board> = {}): Board {
  return {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useTickets', () => {
  it('초기 board는 initialData와 동일하다', () => {
    const initialData = board({ BACKLOG: [withOverdue(ticket({ id: 1 }))] });
    const { result } = renderHook(() => useTickets(initialData));
    expect(result.current.board).toEqual(initialData);
  });

  it('create(data) 호출 시 ticketApi.createTicket이 호출되고 성공하면 board가 refresh된다', async () => {
    mockedTicketApi.createTicket.mockResolvedValueOnce(ticket({ id: 2, title: '새 업무' }));
    const refreshed = board({ BACKLOG: [withOverdue(ticket({ id: 2, title: '새 업무' }))] });
    mockedTicketApi.getBoard.mockResolvedValueOnce({ board: refreshed, total: 1 });

    const { result } = renderHook(() => useTickets(board()));
    await act(async () => {
      await result.current.create({ title: '새 업무' });
    });

    expect(mockedTicketApi.createTicket).toHaveBeenCalledWith({ title: '새 업무' });
    expect(mockedTicketApi.getBoard).toHaveBeenCalledTimes(1);
    expect(result.current.board).toEqual(refreshed);
  });

  it('update(id, data) 호출 시 ticketApi.updateTicket이 호출되고 성공하면 board가 refresh된다', async () => {
    mockedTicketApi.updateTicket.mockResolvedValueOnce(ticket({ id: 5, title: '수정됨' }));
    const refreshed = board({ TODO: [withOverdue(ticket({ id: 5, title: '수정됨' }))] });
    mockedTicketApi.getBoard.mockResolvedValueOnce({ board: refreshed, total: 1 });

    const { result } = renderHook(() => useTickets(board()));
    await act(async () => {
      await result.current.update(5, { title: '수정됨' });
    });

    expect(mockedTicketApi.updateTicket).toHaveBeenCalledWith(5, { title: '수정됨' });
    expect(mockedTicketApi.getBoard).toHaveBeenCalledTimes(1);
    expect(result.current.board).toEqual(refreshed);
  });

  it('remove(id) 호출 시 ticketApi.deleteTicket이 호출되고 성공하면 board가 refresh된다', async () => {
    mockedTicketApi.deleteTicket.mockResolvedValueOnce(undefined);
    const refreshed = board();
    mockedTicketApi.getBoard.mockResolvedValueOnce({ board: refreshed, total: 0 });

    const { result } = renderHook(() =>
      useTickets(board({ TODO: [withOverdue(ticket({ id: 5 }))] }))
    );
    await act(async () => {
      await result.current.remove(5);
    });

    expect(mockedTicketApi.deleteTicket).toHaveBeenCalledWith(5);
    expect(mockedTicketApi.getBoard).toHaveBeenCalledTimes(1);
    expect(result.current.board).toEqual(refreshed);
  });

  describe('reorder (낙관적 업데이트: 백업 → 즉시 반영 → API → 실패 시 롤백)', () => {
    it('호출 즉시(응답 전) board가 낙관적으로 이동한다', async () => {
      let resolveReorder!: (value: { ticket: Ticket; affected: { id: number; position: number }[] }) => void;
      mockedTicketApi.reorderTicket.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveReorder = resolve;
          })
      );

      const initialData = board({
        TODO: [withOverdue(ticket({ id: 3, status: 'TODO', position: 1024 }))],
      });
      const { result } = renderHook(() => useTickets(initialData));

      let reorderPromise!: Promise<boolean>;
      act(() => {
        reorderPromise = result.current.reorder(3, 'IN_PROGRESS', 2048);
      });

      expect(result.current.board.TODO).toHaveLength(0);
      expect(result.current.board.IN_PROGRESS.map((t) => t.id)).toEqual([3]);
      expect(result.current.board.IN_PROGRESS[0].position).toBe(2048);

      resolveReorder({ ticket: ticket({ id: 3, status: 'IN_PROGRESS', position: 2048 }), affected: [] });
      await act(async () => {
        await reorderPromise;
      });
    });

    it('성공하면 서버 응답(ticket + affected)으로 board가 확정된다', async () => {
      const initialData = board({
        TODO: [withOverdue(ticket({ id: 3, status: 'TODO', position: 1024 }))],
        IN_PROGRESS: [withOverdue(ticket({ id: 7, status: 'IN_PROGRESS', position: 1024 }))],
      });
      mockedTicketApi.reorderTicket.mockResolvedValueOnce({
        ticket: ticket({ id: 3, status: 'IN_PROGRESS', position: 1024 }),
        affected: [{ id: 7, position: 2048 }],
      });

      const { result } = renderHook(() => useTickets(initialData));
      await act(async () => {
        await result.current.reorder(3, 'IN_PROGRESS', 512);
      });

      const positions = Object.fromEntries(
        result.current.board.IN_PROGRESS.map((t) => [t.id, t.position])
      );
      expect(positions).toEqual({ 3: 1024, 7: 2048 });
    });

    it('실패하면 백업 상태로 롤백되고 error가 설정된다', async () => {
      const initialData = board({
        TODO: [withOverdue(ticket({ id: 3, status: 'TODO', position: 1024 }))],
      });
      mockedTicketApi.reorderTicket.mockRejectedValueOnce(new Error('티켓을 찾을 수 없습니다'));

      const { result } = renderHook(() => useTickets(initialData));
      await act(async () => {
        await result.current.reorder(3, 'IN_PROGRESS', 2048);
      });

      expect(result.current.board).toEqual(initialData);
      expect(result.current.error).toBe('티켓을 찾을 수 없습니다');
    });
  });

  describe('complete (낙관적 업데이트: 백업 → 즉시 반영 → API → 실패 시 롤백)', () => {
    it('호출 즉시(응답 전) board가 낙관적으로 DONE으로 이동한다', async () => {
      let resolveComplete!: (value: Ticket) => void;
      mockedTicketApi.completeTicket.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveComplete = resolve;
          })
      );

      const initialData = board({
        IN_PROGRESS: [withOverdue(ticket({ id: 5, status: 'IN_PROGRESS' }))],
      });
      const { result } = renderHook(() => useTickets(initialData));

      let completePromise!: Promise<boolean>;
      act(() => {
        completePromise = result.current.complete(5);
      });

      expect(result.current.board.IN_PROGRESS).toHaveLength(0);
      expect(result.current.board.DONE.map((t) => t.id)).toEqual([5]);
      expect(result.current.board.DONE[0].status).toBe('DONE');

      resolveComplete(ticket({ id: 5, status: 'DONE', position: -1024, completedAt: now }));
      await act(async () => {
        await completePromise;
      });
    });

    it('성공하면 서버 응답으로 board가 확정된다', async () => {
      const initialData = board({
        IN_PROGRESS: [withOverdue(ticket({ id: 5, status: 'IN_PROGRESS' }))],
      });
      const completed = ticket({ id: 5, status: 'DONE', position: -1024, completedAt: now });
      mockedTicketApi.completeTicket.mockResolvedValueOnce(completed);

      const { result } = renderHook(() => useTickets(initialData));
      await act(async () => {
        await result.current.complete(5);
      });

      expect(result.current.board.DONE).toEqual([{ ...completed, isOverdue: false }]);
    });

    it('실패하면 백업 상태로 롤백되고 error가 설정된다', async () => {
      const initialData = board({
        IN_PROGRESS: [withOverdue(ticket({ id: 5, status: 'IN_PROGRESS' }))],
      });
      mockedTicketApi.completeTicket.mockRejectedValueOnce(new Error('티켓을 찾을 수 없습니다'));

      const { result } = renderHook(() => useTickets(initialData));
      await act(async () => {
        await result.current.complete(5);
      });

      expect(result.current.board).toEqual(initialData);
      expect(result.current.error).toBe('티켓을 찾을 수 없습니다');
    });
  });

  it('API 호출 중에는 isLoading이 true다', async () => {
    let resolveCreate!: (value: Ticket) => void;
    mockedTicketApi.createTicket.mockImplementationOnce(
      () =>
        new Promise<Ticket>((resolve) => {
          resolveCreate = resolve;
        })
    );

    const { result } = renderHook(() => useTickets(board()));

    let createPromise!: Promise<boolean>;
    act(() => {
      createPromise = result.current.create({ title: '새 업무' });
    });

    expect(result.current.isLoading).toBe(true);

    mockedTicketApi.getBoard.mockResolvedValueOnce({ board: board(), total: 0 });
    await act(async () => {
      resolveCreate(ticket());
      await createPromise;
    });
  });

  it('API 호출이 끝나면 isLoading이 false로 돌아온다', async () => {
    mockedTicketApi.createTicket.mockResolvedValueOnce(ticket());
    mockedTicketApi.getBoard.mockResolvedValueOnce({ board: board(), total: 0 });

    const { result } = renderHook(() => useTickets(board()));
    await act(async () => {
      await result.current.create({ title: '새 업무' });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('API가 실패하면 error 상태가 설정된다', async () => {
    mockedTicketApi.createTicket.mockRejectedValueOnce(new Error('제목을 입력해주세요'));

    const { result } = renderHook(() => useTickets(board()));
    await act(async () => {
      await result.current.create({ title: '' });
    });

    expect(result.current.error).toBe('제목을 입력해주세요');
  });

  it('API가 실패하면 board가 refresh되지 않는다(getBoard가 호출되지 않는다)', async () => {
    const initialData = board({ TODO: [withOverdue(ticket({ id: 9 }))] });
    mockedTicketApi.updateTicket.mockRejectedValueOnce(new Error('티켓을 찾을 수 없습니다'));

    const { result } = renderHook(() => useTickets(initialData));
    await act(async () => {
      await result.current.update(999, { title: 'x' });
    });

    expect(mockedTicketApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board).toEqual(initialData);
  });

  it('create가 성공하면 true, 실패하면 false를 반환한다 (호출부가 성공 여부로 분기할 수 있도록)', async () => {
    mockedTicketApi.createTicket.mockResolvedValueOnce(ticket());
    mockedTicketApi.getBoard.mockResolvedValueOnce({ board: board(), total: 0 });
    const { result } = renderHook(() => useTickets(board()));

    let succeeded!: boolean;
    await act(async () => {
      succeeded = await result.current.create({ title: '새 업무' });
    });
    expect(succeeded).toBe(true);

    mockedTicketApi.createTicket.mockRejectedValueOnce(new Error('제목을 입력해주세요'));
    let failed!: boolean;
    await act(async () => {
      failed = await result.current.create({ title: '' });
    });
    expect(failed).toBe(false);
  });
});
