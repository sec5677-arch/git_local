import { isThisWeek, filterBoard, countForFilters } from '@/client/lib/board-filters';
import type { Board, TicketWithOverdue } from '@/shared/types/ticket';

const now = new Date();

function ticket(overrides: Partial<TicketWithOverdue> = {}): TicketWithOverdue {
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
    isOverdue: false,
    ...overrides,
  };
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

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function thisWeekMonday(): Date {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  return monday;
}

describe('isThisWeek', () => {
  it('dueDate가 이번 주(월~일) 범위 안이고 status가 TODO/IN_PROGRESS면 true다', () => {
    const monday = thisWeekMonday();
    expect(isThisWeek(ticket({ status: 'TODO', dueDate: toDateString(monday) }))).toBe(true);
    expect(isThisWeek(ticket({ status: 'IN_PROGRESS', dueDate: toDateString(monday) }))).toBe(true);
  });

  it('status가 BACKLOG 또는 DONE이면 범위 안이어도 false다', () => {
    const monday = thisWeekMonday();
    expect(isThisWeek(ticket({ status: 'BACKLOG', dueDate: toDateString(monday) }))).toBe(false);
    expect(isThisWeek(ticket({ status: 'DONE', dueDate: toDateString(monday) }))).toBe(false);
  });

  it('dueDate가 없으면 false다', () => {
    expect(isThisWeek(ticket({ status: 'TODO', dueDate: null }))).toBe(false);
  });

  it('dueDate가 이번 주 범위 밖이면 false다', () => {
    expect(isThisWeek(ticket({ status: 'TODO', dueDate: '2000-01-01' }))).toBe(false);
  });
});

describe('filterBoard', () => {
  it('filter==="all"이면 원본 board를 그대로 반환한다', () => {
    const original = board({ TODO: [ticket({ id: 1 })] });
    expect(filterBoard(original, 'all')).toEqual(original);
  });

  it('filter==="thisWeek"이면 TODO/IN_PROGRESS만 필터링하고 BACKLOG/DONE은 그대로 둔다', () => {
    const monday = thisWeekMonday();
    const matching = ticket({ id: 1, status: 'TODO', dueDate: toDateString(monday) });
    const nonMatching = ticket({ id: 2, status: 'TODO', dueDate: null });
    const backlogTicket = ticket({ id: 3, status: 'BACKLOG', dueDate: null });
    const doneTicket = ticket({ id: 4, status: 'DONE' });

    const result = filterBoard(
      board({ TODO: [matching, nonMatching], BACKLOG: [backlogTicket], DONE: [doneTicket] }),
      'thisWeek'
    );

    expect(result.TODO).toEqual([matching]);
    expect(result.BACKLOG).toEqual([backlogTicket]);
    expect(result.DONE).toEqual([doneTicket]);
  });

  it('filter==="overdue"이면 isOverdue=true인 TODO/IN_PROGRESS만 남기고 BACKLOG/DONE은 그대로 둔다', () => {
    const overdueTicket = ticket({ id: 1, status: 'TODO', isOverdue: true });
    const normalTicket = ticket({ id: 2, status: 'TODO', isOverdue: false });
    const backlogTicket = ticket({ id: 3, status: 'BACKLOG', isOverdue: true });

    const result = filterBoard(
      board({ TODO: [overdueTicket, normalTicket], BACKLOG: [backlogTicket] }),
      'overdue'
    );

    expect(result.TODO).toEqual([overdueTicket]);
    expect(result.BACKLOG).toEqual([backlogTicket]);
  });
});

describe('countForFilters', () => {
  it('thisWeek/overdue 조건에 맞는 티켓 수를 정확히 계산한다', () => {
    const monday = thisWeekMonday();
    const thisWeekTicket = ticket({ id: 1, status: 'TODO', dueDate: toDateString(monday) });
    const overdueTicket = ticket({ id: 2, status: 'IN_PROGRESS', isOverdue: true });
    const plainTicket = ticket({ id: 3, status: 'TODO' });

    const counts = countForFilters(
      board({ TODO: [thisWeekTicket, plainTicket], IN_PROGRESS: [overdueTicket] })
    );

    expect(counts).toEqual({ thisWeek: 1, overdue: 1 });
  });
});
