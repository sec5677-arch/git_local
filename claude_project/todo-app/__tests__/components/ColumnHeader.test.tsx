import { render, screen } from '@testing-library/react';
import { ColumnHeader } from '@/client/components/ColumnHeader';

describe('ColumnHeader', () => {
  it('칼럼명을 표시한다', () => {
    render(<ColumnHeader title="TODO" count={3} />);
    expect(screen.getByText('TODO')).toBeInTheDocument();
  });

  it('티켓 수를 표시한다', () => {
    render(<ColumnHeader title="TODO" count={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('count가 0이어도 표시된다', () => {
    render(<ColumnHeader title="Done" count={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('title은 column-title, count는 column-count 클래스로 표시된다', () => {
    render(<ColumnHeader title="TODO" count={3} />);
    expect(screen.getByText('TODO')).toHaveClass('column-title');
    expect(screen.getByText('3')).toHaveClass('column-count');
  });
});
