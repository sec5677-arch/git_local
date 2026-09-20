import { render, screen } from '@testing-library/react';
import { TicketDetailView } from '@/client/components/TicketDetailView';
import type { Ticket } from '@/shared/types/ticket';

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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('TicketDetailView', () => {
  it('status, startedAt, completedAt, createdAt을 읽기 전용으로 표시한다', () => {
    render(
      <TicketDetailView
        ticket={ticket({
          status: 'IN_PROGRESS',
          startedAt: new Date('2026-02-01T00:00:00.000Z'),
          completedAt: new Date('2026-03-01T00:00:00.000Z'),
          createdAt: new Date('2026-01-15T00:00:00.000Z'),
        })}
      />
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('2026-02-01')).toBeInTheDocument();
    expect(screen.getByText('2026-03-01')).toBeInTheDocument();
    expect(screen.getByText('2026-01-15')).toBeInTheDocument();
  });

  it('startedAt/completedAt이 null이면 "-"로 표시한다', () => {
    render(<TicketDetailView ticket={ticket({ startedAt: null, completedAt: null })} />);

    expect(screen.getAllByText('-')).toHaveLength(2);
  });

  it('편집 가능한 입력 요소(input/textarea/select/button)를 포함하지 않는다', () => {
    const { container } = render(<TicketDetailView ticket={ticket()} />);
    expect(container.querySelectorAll('input, textarea, select, button')).toHaveLength(0);
  });
});
