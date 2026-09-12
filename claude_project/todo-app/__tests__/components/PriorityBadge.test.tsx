import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '@/client/components/PriorityBadge';

describe('PriorityBadge', () => {
  it('LOW → badge--low, "낮음" 표시', () => {
    render(<PriorityBadge priority="LOW" />);
    const el = screen.getByText('낮음');
    expect(el).toHaveClass('badge--low');
  });

  it('MEDIUM → badge--medium, "보통" 표시', () => {
    render(<PriorityBadge priority="MEDIUM" />);
    const el = screen.getByText('보통');
    expect(el).toHaveClass('badge--medium');
  });

  it('HIGH → badge--high, "높음" 표시', () => {
    render(<PriorityBadge priority="HIGH" />);
    const el = screen.getByText('높음');
    expect(el).toHaveClass('badge--high');
  });
});
