import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Board as BoardData, TicketWithOverdue } from '@/shared/types/ticket';

const mockUseTickets = jest.fn();
jest.mock('@/client/hooks/useTickets', () => ({
  useTickets: (...args: unknown[]) => mockUseTickets(...args),
}));

const mockBoard = jest.fn();
jest.mock('@/client/components/Board', () => ({
  Board: (props: {
    board: BoardData;
    onTicketClick: (ticket: TicketWithOverdue) => void;
    onDragEnd?: (event: unknown) => void;
    filterBar?: React.ReactNode;
  }) => {
    mockBoard(props);
    return (
      <div data-testid="board-stub">
        {props.filterBar}
        {(Object.values(props.board) as TicketWithOverdue[][]).flat().map((t) => (
          <button key={t.id} onClick={() => props.onTicketClick(t)}>
            {t.title}
          </button>
        ))}
      </div>
    );
  },
}));

import { BoardContainer } from '@/client/components/BoardContainer';

function ticket(overrides: Partial<TicketWithOverdue> = {}): TicketWithOverdue {
  return {
    id: 1,
    title: '제목',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    position: 1024,
    plannedStartDate: null,
    dueDate: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    isOverdue: false,
    ...overrides,
  };
}

function board(overrides: Partial<BoardData> = {}): BoardData {
  return {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
    ...overrides,
  };
}

function mockHook(overrides: Partial<ReturnType<typeof defaultHookReturn>> = {}) {
  const value = { ...defaultHookReturn(), ...overrides };
  mockUseTickets.mockReturnValue(value);
  return value;
}

function defaultHookReturn() {
  return {
    board: board(),
    isLoading: false,
    error: null,
    create: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
    remove: jest.fn().mockResolvedValue(true),
    reorder: jest.fn().mockResolvedValue(true),
    complete: jest.fn().mockResolvedValue(true),
  };
}

function latestBoardProps() {
  return mockBoard.mock.calls[mockBoard.mock.calls.length - 1][0];
}

beforeEach(() => {
  mockUseTickets.mockReset();
  mockBoard.mockClear();
});

describe('BoardContainer', () => {
  it('"새 업무" 클릭 시 생성 모달이 열린다', async () => {
    mockHook();
    render(<BoardContainer initialData={board()} />);

    await userEvent.click(screen.getByRole('button', { name: '새 업무' }));

    expect(screen.getByRole('heading', { name: '새 업무' })).toBeInTheDocument();
    expect(screen.getByLabelText('제목')).toBeInTheDocument();
  });

  it('생성 폼 제출 시 useTickets.create가 호출되고 성공하면 모달이 닫힌다', async () => {
    const hook = mockHook();
    render(<BoardContainer initialData={board()} />);

    await userEvent.click(screen.getByRole('button', { name: '새 업무' }));
    await userEvent.type(screen.getByLabelText('제목'), '새 티켓');
    await userEvent.click(screen.getByRole('button', { name: '생성' }));

    expect(hook.create).toHaveBeenCalledWith(expect.objectContaining({ title: '새 티켓' }));
    expect(screen.queryByRole('heading', { name: '새 업무' })).not.toBeInTheDocument();
  });

  it('카드 클릭 시 TicketModal이 해당 티켓으로 열린다', async () => {
    mockHook({ board: board({ TODO: [ticket({ id: 7, title: '카드 A' })] }) });
    render(<BoardContainer initialData={board()} />);

    await userEvent.click(screen.getByRole('button', { name: '카드 A' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('제목')).toHaveValue('카드 A');
  });

  it('TicketModal에서 수정 제출 시 useTickets.update가 호출된다', async () => {
    const hook = mockHook({ board: board({ TODO: [ticket({ id: 7, title: '카드 A' })] }) });
    render(<BoardContainer initialData={board()} />);

    await userEvent.click(screen.getByRole('button', { name: '카드 A' }));
    await userEvent.clear(screen.getByLabelText('제목'));
    await userEvent.type(screen.getByLabelText('제목'), '수정된 제목');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(hook.update).toHaveBeenCalledWith(7, expect.objectContaining({ title: '수정된 제목' }));
  });

  it('TicketModal에서 삭제 확인 시 useTickets.remove가 호출되고 모달이 닫힌다', async () => {
    const hook = mockHook({ board: board({ TODO: [ticket({ id: 7, title: '카드 A' })] }) });
    render(<BoardContainer initialData={board()} />);

    await userEvent.click(screen.getByRole('button', { name: '카드 A' }));
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(hook.remove).toHaveBeenCalledWith(7);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('드래그 종료 시 대상이 DONE 칼럼이면 complete가 호출된다(reorder 아님)', () => {
    const hook = mockHook({ board: board({ TODO: [ticket({ id: 7, position: 1024 })] }) });
    render(<BoardContainer initialData={board()} />);

    latestBoardProps().onDragEnd({ active: { id: 7 }, over: { id: 'DONE' } });

    expect(hook.complete).toHaveBeenCalledWith(7);
    expect(hook.reorder).not.toHaveBeenCalled();
  });

  it('드래그 종료 시 대상이 DONE이 아니면 reorder가 계산된 position과 함께 호출된다', () => {
    const hook = mockHook({
      board: board({
        TODO: [ticket({ id: 7, status: 'TODO', position: 1024 })],
        IN_PROGRESS: [ticket({ id: 9, status: 'IN_PROGRESS', position: 1024 })],
      }),
    });
    render(<BoardContainer initialData={board()} />);

    latestBoardProps().onDragEnd({ active: { id: 7 }, over: { id: 9 } });

    expect(hook.reorder).toHaveBeenCalledWith(7, 'IN_PROGRESS', 0);
    expect(hook.complete).not.toHaveBeenCalled();
  });

  it('필터 버튼 클릭 시 Board에 전달되는 board prop이 board-filters.filterBoard 결과와 일치한다', async () => {
    const monday = (() => {
      const today = new Date();
      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const d = new Date(today);
      d.setDate(today.getDate() + diff);
      return d.toISOString().split('T')[0];
    })();

    const matching = ticket({ id: 1, status: 'TODO', dueDate: monday });
    const nonMatching = ticket({ id: 2, status: 'TODO', dueDate: null });
    mockHook({ board: board({ TODO: [matching, nonMatching] }) });

    render(<BoardContainer initialData={board()} />);
    await userEvent.click(screen.getByRole('button', { name: /이번주 업무/ }));

    expect(latestBoardProps().board.TODO).toEqual([matching]);
  });

  it('FilterBar의 counts가 board-filters.countForFilters(board) 결과와 일치한다', () => {
    const thisWeekTicket = ticket({ id: 1, status: 'TODO', dueDate: new Date().toISOString().split('T')[0] });
    const overdueTicket = ticket({ id: 2, status: 'IN_PROGRESS', isOverdue: true });
    mockHook({ board: board({ TODO: [thisWeekTicket], IN_PROGRESS: [overdueTicket] }) });

    render(<BoardContainer initialData={board()} />);

    expect(screen.getByRole('button', { name: /이번주 업무/ })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /일정 초과/ })).toHaveTextContent('1');
  });
});
