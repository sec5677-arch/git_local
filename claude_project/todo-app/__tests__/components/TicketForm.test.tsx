import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketForm } from '@/client/components/TicketForm';

function getSubmitButton() {
  return screen.getByRole('button', { name: /^(생성|저장|처리중\.\.\.)$/ });
}

describe('TicketForm', () => {
  it('C004-1: mode="create"이면 빈 필드 + 우선순위 MEDIUM 기본값으로 렌더링된다', () => {
    render(<TicketForm mode="create" onSubmit={jest.fn()} onCancel={jest.fn()} isLoading={false} />);

    expect(screen.getByLabelText('제목')).toHaveValue('');
    expect(screen.getByLabelText('설명')).toHaveValue('');
    expect(screen.getByLabelText('우선순위')).toHaveValue('MEDIUM');
    expect(screen.getByLabelText('시작예정일')).toHaveValue('');
    expect(screen.getByLabelText('종료예정일')).toHaveValue('');
  });

  it('C004-2: mode="edit" + initialData가 있으면 각 필드에 기존 값이 채워진다', () => {
    render(
      <TicketForm
        mode="edit"
        initialData={{
          title: '기존 제목',
          description: '기존 설명',
          priority: 'HIGH',
          plannedStartDate: '2026-01-01',
          dueDate: '2026-12-31',
        }}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByLabelText('제목')).toHaveValue('기존 제목');
    expect(screen.getByLabelText('설명')).toHaveValue('기존 설명');
    expect(screen.getByLabelText('우선순위')).toHaveValue('HIGH');
    expect(screen.getByLabelText('시작예정일')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('종료예정일')).toHaveValue('2026-12-31');
  });

  it('C004-3: 빈 제목으로 제출하면 "제목을 입력해주세요" 에러가 표시되고 onSubmit이 호출되지 않는다', async () => {
    const onSubmit = jest.fn();
    render(<TicketForm mode="create" onSubmit={onSubmit} onCancel={jest.fn()} isLoading={false} />);

    await userEvent.click(getSubmitButton());

    expect(await screen.findByText('제목을 입력해주세요')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('C004-4: 과거 종료예정일로 제출하면 "종료예정일은 오늘 이후 날짜를 선택해주세요" 에러가 표시된다', async () => {
    const onSubmit = jest.fn();
    render(<TicketForm mode="create" onSubmit={onSubmit} onCancel={jest.fn()} isLoading={false} />);

    await userEvent.type(screen.getByLabelText('제목'), '유효한 제목');
    fireEvent.change(screen.getByLabelText('종료예정일'), { target: { value: '2020-01-01' } });
    await userEvent.click(getSubmitButton());

    expect(
      await screen.findByText('종료예정일은 오늘 이후 날짜를 선택해주세요')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(['create', 'edit'] as const)(
    'C004-5: mode=%s에서 시작예정일(plannedStartDate) date input이 렌더링된다',
    (mode) => {
      render(
        <TicketForm
          mode={mode}
          initialData={mode === 'edit' ? { title: '제목' } : undefined}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
          isLoading={false}
        />
      );

      expect(screen.getByLabelText('시작예정일')).toHaveAttribute('type', 'date');
    }
  );

  it('C004-6: 유효한 값으로 제출하면 onSubmit이 입력된 데이터와 함께 호출된다', async () => {
    const onSubmit = jest.fn();
    render(<TicketForm mode="create" onSubmit={onSubmit} onCancel={jest.fn()} isLoading={false} />);

    await userEvent.type(screen.getByLabelText('제목'), '새 업무');
    await userEvent.type(screen.getByLabelText('설명'), '설명입니다');
    await userEvent.selectOptions(screen.getByLabelText('우선순위'), 'HIGH');
    fireEvent.change(screen.getByLabelText('시작예정일'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('종료예정일'), { target: { value: '2099-12-31' } });
    await userEvent.click(getSubmitButton());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: '새 업무',
      description: '설명입니다',
      priority: 'HIGH',
      plannedStartDate: '2026-01-01',
      dueDate: '2099-12-31',
    });
  });

  it('C004-7: isLoading=true이면 제출 버튼이 비활성화된다', () => {
    render(<TicketForm mode="create" onSubmit={jest.fn()} onCancel={jest.fn()} isLoading />);

    expect(getSubmitButton()).toBeDisabled();
  });
});
