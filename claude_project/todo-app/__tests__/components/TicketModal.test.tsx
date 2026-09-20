import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketModal } from '@/client/components/TicketModal';
import type { TicketWithOverdue } from '@/shared/types/ticket';

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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    isOverdue: false,
    ...overrides,
  };
}

describe('TicketModal', () => {
  it('C005-1: isOpen에 따라 표시/숨김된다', () => {
    const { rerender } = render(
      <TicketModal
        ticket={ticket()}
        isOpen={false}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <TicketModal ticket={ticket()} isOpen onClose={jest.fn()} onUpdate={jest.fn()} onDelete={jest.fn()} />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('C005-2: 시작일/종료일/상태/생성일이 읽기 전용으로 표시된다', () => {
    render(
      <TicketModal
        ticket={ticket({
          status: 'IN_PROGRESS',
          startedAt: new Date('2026-02-01T00:00:00.000Z'),
          completedAt: null,
          createdAt: new Date('2026-01-15T00:00:00.000Z'),
        })}
        isOpen
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('2026-02-01')).toBeInTheDocument();
    expect(screen.getByText('2026-01-15')).toBeInTheDocument();
  });

  it('C005-3: 제목/설명/우선순위/시작예정일/종료예정일이 편집 가능하다', () => {
    render(
      <TicketModal
        ticket={ticket({
          title: '기존 제목',
          description: '기존 설명',
          priority: 'HIGH',
          plannedStartDate: '2026-01-01',
          dueDate: '2026-12-31',
        })}
        isOpen
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByLabelText('제목')).toHaveValue('기존 제목');
    expect(screen.getByLabelText('설명')).toHaveValue('기존 설명');
    expect(screen.getByLabelText('우선순위')).toHaveValue('HIGH');
    expect(screen.getByLabelText('시작예정일')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('종료예정일')).toHaveValue('2026-12-31');
  });

  it('C005-4: ESC 키로 onClose가 호출된다', async () => {
    const onClose = jest.fn();
    render(<TicketModal ticket={ticket()} isOpen onClose={onClose} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('C005-5: 오버레이 클릭으로 onClose가 호출된다', async () => {
    const onClose = jest.fn();
    render(<TicketModal ticket={ticket()} isOpen onClose={onClose} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    await userEvent.click(screen.getByTestId('modal-overlay'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('C005-6: 삭제 버튼 → ConfirmDialog 표시 → 확인 → onDelete(ticket.id) 호출', async () => {
    const onDelete = jest.fn();
    render(
      <TicketModal
        ticket={ticket({ id: 42 })}
        isOpen
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByText('정말 삭제하시겠습니까?')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onDelete).toHaveBeenCalledWith(42);
  });

  it('TicketForm에서 유효한 데이터로 제출하면 onUpdate(ticket.id, data)가 호출된다', async () => {
    const onUpdate = jest.fn();
    render(
      <TicketModal
        ticket={ticket({ id: 7, title: '기존 제목' })}
        isOpen
        onClose={jest.fn()}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
      />
    );

    await userEvent.clear(screen.getByLabelText('제목'));
    await userEvent.type(screen.getByLabelText('제목'), '수정된 제목');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0]).toBe(7);
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ title: '수정된 제목' });
  });
});
