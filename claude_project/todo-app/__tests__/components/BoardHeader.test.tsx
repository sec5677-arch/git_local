import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardHeader } from '@/client/components/BoardHeader';

describe('BoardHeader', () => {
  it('"Tika" 타이틀을 표시한다', () => {
    render(<BoardHeader onCreateClick={jest.fn()} />);
    expect(screen.getByText('Tika')).toBeInTheDocument();
  });

  it('검색 입력창이 placeholder와 함께 disabled 상태로 렌더링된다', () => {
    render(<BoardHeader onCreateClick={jest.fn()} />);
    expect(screen.getByPlaceholderText('Search')).toBeDisabled();
  });

  it('"새 업무" 버튼이 렌더링된다', () => {
    render(<BoardHeader onCreateClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: '새 업무' })).toBeInTheDocument();
  });

  it('"새 업무" 버튼 클릭 시 onCreateClick이 호출된다', async () => {
    const onCreateClick = jest.fn();
    render(<BoardHeader onCreateClick={onCreateClick} />);
    await userEvent.click(screen.getByRole('button', { name: '새 업무' }));
    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });
});
