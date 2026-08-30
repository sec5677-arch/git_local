import { render, screen } from '@testing-library/react';
import { TICKET_STATUS } from '@/shared/constants';

/**
 * Jest 환경 검증용 샘플 컴포넌트 테스트 (client / jsdom).
 * - @testing-library/react의 render 동작 확인 (React 19)
 * - @testing-library/jest-dom 매처(toBeInTheDocument) 동작 확인
 * - @/ 경로 별칭 → src/ 해결 확인
 */
function SampleStatus({ status }: { status: string }) {
  return <div data-testid="status">{status}</div>;
}

describe('Sample component test (jest config 검증)', () => {
  it('경로 별칭 @/shared/constants 로 값을 가져온다', () => {
    expect(TICKET_STATUS.TODO).toBe('TODO');
  });

  it('React 19 렌더링 + jest-dom 매처가 동작한다', () => {
    render(<SampleStatus status={TICKET_STATUS.IN_PROGRESS} />);
    const el = screen.getByTestId('status');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('IN_PROGRESS');
  });
});
