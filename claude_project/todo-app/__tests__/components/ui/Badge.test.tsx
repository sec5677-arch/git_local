import { render, screen } from '@testing-library/react';
import { Badge } from '@/client/components/ui/Badge';

describe('Badge', () => {
  it('children을 렌더링한다', () => {
    render(<Badge>HIGH</Badge>);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('variant에 따라 badge--{variant} 클래스가 붙는다', () => {
    render(<Badge variant="high">HIGH</Badge>);
    expect(screen.getByText('HIGH')).toHaveClass('badge--high');
  });

  it('variant를 생략하면 기본(중립) 스타일로 렌더링된다', () => {
    render(<Badge>기본</Badge>);
    const el = screen.getByText('기본');
    expect(el).toHaveClass('badge');
    expect(el.className).not.toMatch(/badge--/);
  });
});
