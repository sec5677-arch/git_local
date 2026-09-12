import { render, screen } from '@testing-library/react';
import { DueDateBadge } from '@/client/components/DueDateBadge';

describe('DueDateBadge', () => {
  it('dueDate가 null이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<DueDateBadge dueDate={null} isOverdue={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('dueDate가 있으면 YYYY-MM-DD 그대로 표시한다', () => {
    render(<DueDateBadge dueDate="2026-02-15" isOverdue={false} />);
    expect(screen.getByText('2026-02-15')).toBeInTheDocument();
  });

  it('isOverdue=true면 badge--overdue 스타일이 적용된다', () => {
    render(<DueDateBadge dueDate="2020-01-01" isOverdue />);
    expect(screen.getByText('2020-01-01')).toHaveClass('badge--overdue');
  });

  it('isOverdue=false면 badge--due 스타일이 적용된다', () => {
    render(<DueDateBadge dueDate="2026-12-31" isOverdue={false} />);
    expect(screen.getByText('2026-12-31')).toHaveClass('badge--due');
  });
});
