import { render, screen, within, act } from '@testing-library/react';
import type { TicketWithOverdue, Board as BoardData } from '@/shared/types/ticket';

const mockDndContext = jest.fn();
jest.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: jest.fn() }),
  useSensor: () => null,
  useSensors: () => [],
  PointerSensor: class PointerSensor {},
  DndContext: (props: {
    children: React.ReactNode;
    onDragStart?: (event: unknown) => void;
    onDragOver?: (event: unknown) => void;
    onDragEnd?: (event: unknown) => void;
  }) => {
    mockDndContext(props);
    return <>{props.children}</>;
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
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

import { Board } from '@/client/components/Board';

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

function board(overrides: Partial<BoardData> = {}): BoardData {
  return {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
    ...overrides,
  };
}

describe('Board', () => {
  beforeEach(() => {
    mockDndContext.mockClear();
  });

  it('C003-1: BACKLOG, TODO, IN_PROGRESS, DONE 순서로 4개 칼럼이 렌더링된다', () => {
    const { container } = render(<Board board={board()} onTicketClick={jest.fn()} />);
    const titles = Array.from(container.querySelectorAll('.column-title')).map(
      (el) => el.textContent
    );
    expect(titles).toEqual(['Backlog', 'TODO', 'In Progress', 'Done']);
  });

  it('C003-2: BACKLOG는 board-sidebar에, 나머지 3개는 board-main에 배치된다', () => {
    const { container } = render(<Board board={board()} onTicketClick={jest.fn()} />);
    const sidebar = container.querySelector('.board-sidebar');
    const main = container.querySelector('.board-main');
    expect(sidebar).not.toBeNull();
    expect(main).not.toBeNull();
    expect(within(sidebar as HTMLElement).getByText('Backlog')).toBeInTheDocument();
    expect(within(main as HTMLElement).getByText('TODO')).toBeInTheDocument();
    expect(within(main as HTMLElement).getByText('In Progress')).toBeInTheDocument();
    expect(within(main as HTMLElement).getByText('Done')).toBeInTheDocument();
    expect(within(sidebar as HTMLElement).queryByText('TODO')).not.toBeInTheDocument();
  });

  it('C003-3: board-content/columns-container 레이아웃 클래스가 적용된다', () => {
    const { container } = render(<Board board={board()} onTicketClick={jest.fn()} />);
    expect(container.querySelector('.board-content')).toBeInTheDocument();
    expect(container.querySelector('.board-sidebar')).toBeInTheDocument();
    expect(container.querySelector('.board-main .columns-container')).toBeInTheDocument();
  });

  it('각 칼럼에 해당 status의 tickets만 전달된다', () => {
    const { container } = render(
      <Board
        board={board({
          BACKLOG: [ticket({ id: 1, title: 'BL-1' })],
          TODO: [ticket({ id: 2, title: 'TD-1' })],
          IN_PROGRESS: [ticket({ id: 3, title: 'IP-1' })],
          DONE: [ticket({ id: 4, title: 'DN-1' })],
        })}
        onTicketClick={jest.fn()}
      />
    );

    const todoColumn = container.querySelector('.column[data-status="TODO"]') as HTMLElement;
    expect(within(todoColumn).getByText('TD-1')).toBeInTheDocument();
    expect(within(todoColumn).queryByText('BL-1')).not.toBeInTheDocument();

    const doneColumn = container.querySelector('.column[data-status="DONE"]') as HTMLElement;
    expect(within(doneColumn).getByText('DN-1')).toBeInTheDocument();
    expect(within(doneColumn).queryByText('IP-1')).not.toBeInTheDocument();
  });

  it('DndContext가 보드 전체를 감싸고, 드래그 시작 시 전달받은 onDragStart가 호출된다', () => {
    const onDragStart = jest.fn();
    render(
      <Board
        board={board({ TODO: [ticket({ id: 2, title: 'TD-1' })] })}
        onTicketClick={jest.fn()}
        onDragStart={onDragStart}
      />
    );

    const dndProps = mockDndContext.mock.calls[0][0];
    const event = { active: { id: 2 } };
    dndProps.onDragStart(event);

    expect(onDragStart).toHaveBeenCalledWith(event);
  });

  it('드래그 시작하면 DragOverlay에 활성 티켓 카드가 복제 렌더링된다', () => {
    render(
      <Board
        board={board({ TODO: [ticket({ id: 2, title: 'TD-1' })] })}
        onTicketClick={jest.fn()}
      />
    );

    expect(within(screen.getByTestId('drag-overlay')).queryByText('TD-1')).not.toBeInTheDocument();

    const dndProps = mockDndContext.mock.calls[0][0];
    act(() => {
      dndProps.onDragStart({ active: { id: 2 } });
    });

    expect(within(screen.getByTestId('drag-overlay')).getByText('TD-1')).toBeInTheDocument();
  });

  it('드래그가 끝나면 DragOverlay가 비워지고 전달받은 onDragEnd가 호출된다', () => {
    const onDragEnd = jest.fn();
    render(
      <Board
        board={board({ TODO: [ticket({ id: 2, title: 'TD-1' })] })}
        onTicketClick={jest.fn()}
        onDragEnd={onDragEnd}
      />
    );

    const dndProps = mockDndContext.mock.calls[0][0];
    act(() => {
      dndProps.onDragStart({ active: { id: 2 } });
    });
    expect(within(screen.getByTestId('drag-overlay')).getByText('TD-1')).toBeInTheDocument();

    const endEvent = { active: { id: 2 }, over: { id: 'DONE' } };
    act(() => {
      dndProps.onDragEnd(endEvent);
    });

    expect(within(screen.getByTestId('drag-overlay')).queryByText('TD-1')).not.toBeInTheDocument();
    expect(onDragEnd).toHaveBeenCalledWith(endEvent);
  });

  it('filterBar prop은 board-right 안에서 board-main보다 먼저(위에) 렌더링된다', () => {
    const { container } = render(
      <Board
        board={board()}
        onTicketClick={jest.fn()}
        filterBar={<div data-testid="filter-bar-slot">필터</div>}
      />
    );

    const boardRight = container.querySelector('.board-right') as HTMLElement;
    expect(boardRight).not.toBeNull();
    expect(within(boardRight).getByTestId('filter-bar-slot')).toBeInTheDocument();

    const filterSlot = screen.getByTestId('filter-bar-slot');
    const boardMain = container.querySelector('.board-main') as HTMLElement;
    expect(
      filterSlot.compareDocumentPosition(boardMain) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('board-sidebar가 board-right(필터+메인)와 나란히 board-content의 자식으로 배치된다 (tika-wireframe.png: 백로그 전체 높이)', () => {
    const { container } = render(<Board board={board()} onTicketClick={jest.fn()} />);
    const boardContent = container.querySelector('.board-content');
    const sidebar = boardContent?.querySelector(':scope > .board-sidebar');
    const right = boardContent?.querySelector(':scope > .board-right');
    expect(sidebar).not.toBeNull();
    expect(right).not.toBeNull();
  });
});
