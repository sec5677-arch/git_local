import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TicketWithOverdue } from '@/shared/types/ticket';

const mockUseSortable = jest.fn();
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: (...args: unknown[]) => mockUseSortable(...args),
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

import { TicketCard } from '@/client/components/TicketCard';

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
    createdAt: new Date(),
    updatedAt: new Date(),
    isOverdue: false,
    ...overrides,
  };
}

function defaultSortable() {
  return {
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  };
}

describe('TicketCard', () => {
  beforeEach(() => {
    mockUseSortable.mockReturnValue(defaultSortable());
  });

  it('C001-1: 제목, 우선순위 뱃지, 종료예정일을 표시한다', () => {
    render(
      <TicketCard ticket={ticket({ title: '문서 작성', priority: 'HIGH', dueDate: '2026-12-31' })} onClick={jest.fn()} />
    );
    expect(screen.getByText('문서 작성')).toBeInTheDocument();
    expect(screen.getByText('높음')).toBeInTheDocument();
    expect(screen.getByText('2026-12-31')).toBeInTheDocument();
  });

  it('C001-2: isOverdue=true면 ticket-card--overdue 스타일이 적용된다', () => {
    render(<TicketCard ticket={ticket({ isOverdue: true })} onClick={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveClass('ticket-card--overdue');
  });

  it('C001-3: status=DONE이면 완료 스타일이 적용된다', () => {
    render(<TicketCard ticket={ticket({ status: 'DONE' })} onClick={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveClass('ticket-card--done');
  });

  it('C001-4: dueDate=null이면 종료예정일 영역이 렌더링되지 않는다', () => {
    render(<TicketCard ticket={ticket({ dueDate: null })} onClick={jest.fn()} />);
    expect(screen.queryByText(/\d{4}-\d{2}-\d{2}/)).not.toBeInTheDocument();
  });

  it('C001-5: 카드 클릭 시 onClick이 호출된다', async () => {
    const onClick = jest.fn();
    render(<TicketCard ticket={ticket()} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('C001-6: 제목에 truncate 클래스가 적용된다', () => {
    render(<TicketCard ticket={ticket({ title: 'a'.repeat(200) })} onClick={jest.fn()} />);
    expect(screen.getByText('a'.repeat(200))).toHaveClass('ticket-card-title');
  });

  it.each([
    ['LOW', '낮음'],
    ['MEDIUM', '보통'],
    ['HIGH', '높음'],
  ] as const)('C001-7: priority=%s면 "%s" 뱃지가 표시된다', (priority, label) => {
    render(<TicketCard ticket={ticket({ priority })} onClick={jest.fn()} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('접근성: role=button, aria-label="티켓: {title}"이 설정된다', () => {
    render(<TicketCard ticket={ticket({ title: '문서 작성' })} onClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: '티켓: 문서 작성' })).toBeInTheDocument();
  });

  it('접근성: Enter 키로 onClick이 호출된다', async () => {
    const onClick = jest.fn();
    render(<TicketCard ticket={ticket()} onClick={onClick} />);
    screen.getByRole('button').focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('드래그 중(isDragging=true)이면 ticket-card--dragging 스타일이 적용된다', () => {
    mockUseSortable.mockReturnValue({ ...defaultSortable(), isDragging: true });
    render(<TicketCard ticket={ticket()} onClick={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveClass('ticket-card--dragging');
  });
});
