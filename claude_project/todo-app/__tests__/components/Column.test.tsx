import { render, screen } from '@testing-library/react';
import type { TicketWithOverdue } from '@/shared/types/ticket';

const mockUseDroppable = jest.fn();
jest.mock('@dnd-kit/core', () => ({
  useDroppable: (...args: unknown[]) => mockUseDroppable(...args),
}));
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: 'vertical',
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

import { Column } from '@/client/components/Column';

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

describe('Column', () => {
  beforeEach(() => {
    mockUseDroppable.mockReturnValue({ setNodeRef: jest.fn() });
  });

  it('C002-1: 티켓이 있으면 카드 목록과 개수 뱃지가 표시된다', () => {
    render(
      <Column
        status="TODO"
        tickets={[ticket({ id: 1, title: '첫 번째' }), ticket({ id: 2, title: '두 번째' })]}
        onTicketClick={jest.fn()}
      />
    );
    expect(screen.getByText('첫 번째')).toBeInTheDocument();
    expect(screen.getByText('두 번째')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('C002-2: tickets가 비어있으면 안내 문구가 표시된다', () => {
    render(<Column status="DONE" tickets={[]} onTicketClick={jest.fn()} />);
    expect(screen.getByText('이 칼럼에 티켓이 없습니다')).toBeInTheDocument();
  });

  it('C002-3: ColumnHeader에 칼럼명과 티켓 수가 전달된다', () => {
    render(
      <Column status="IN_PROGRESS" tickets={[ticket()]} onTicketClick={jest.fn()} />
    );
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('tickets 배열 순서대로 카드를 렌더링한다', () => {
    render(
      <Column
        status="BACKLOG"
        tickets={[ticket({ id: 3, title: 'C' }), ticket({ id: 1, title: 'A' }), ticket({ id: 2, title: 'B' })]}
        onTicketClick={jest.fn()}
      />
    );
    const titles = screen.getAllByRole('button').map((el) => el.textContent);
    expect(titles.findIndex((t) => t?.includes('C'))).toBeLessThan(
      titles.findIndex((t) => t?.includes('A'))
    );
    expect(titles.findIndex((t) => t?.includes('A'))).toBeLessThan(
      titles.findIndex((t) => t?.includes('B'))
    );
  });

  it('useDroppable이 status를 id로 호출된다', () => {
    render(<Column status="DONE" tickets={[]} onTicketClick={jest.fn()} />);
    expect(mockUseDroppable).toHaveBeenCalledWith({ id: 'DONE' });
  });

  it('data-status 속성이 status 값으로 설정된다', () => {
    const { container } = render(
      <Column status="TODO" tickets={[]} onTicketClick={jest.fn()} />
    );
    expect(container.querySelector('.column')).toHaveAttribute('data-status', 'TODO');
  });
});
