import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/client/components/ui/Button';

describe('Button', () => {
  it('children을 정상 렌더링한다', () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it.each(['primary', 'secondary', 'danger', 'ghost'] as const)(
    'variant="%s"이면 btn--%s 클래스가 붙는다',
    (variant) => {
      render(<Button variant={variant}>버튼</Button>);
      expect(screen.getByRole('button', { name: '버튼' })).toHaveClass(`btn--${variant}`);
    }
  );

  it.each(['sm', 'md', 'lg'] as const)(
    'size="%s"이면 btn--%s 클래스가 붙는다',
    (size) => {
      render(<Button size={size}>버튼</Button>);
      expect(screen.getByRole('button', { name: '버튼' })).toHaveClass(`btn--${size}`);
    }
  );

  it('variant/size를 생략하면 기본값 primary/md가 적용된다', () => {
    render(<Button>버튼</Button>);
    const btn = screen.getByRole('button', { name: '버튼' });
    expect(btn).toHaveClass('btn--primary');
    expect(btn).toHaveClass('btn--md');
  });

  it('클릭 시 onClick 핸들러가 호출된다', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>클릭</Button>);
    await userEvent.click(screen.getByRole('button', { name: '클릭' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('isLoading=true이면 비활성화되고 "처리중..."이 표시된다', () => {
    render(<Button isLoading>저장</Button>);
    const btn = screen.getByRole('button', { name: '처리중...' });
    expect(btn).toBeDisabled();
  });

  it('isLoading=true일 때 클릭해도 onClick이 호출되지 않는다', async () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} isLoading>
        저장
      </Button>
    );
    await userEvent.click(screen.getByRole('button', { name: '처리중...' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
