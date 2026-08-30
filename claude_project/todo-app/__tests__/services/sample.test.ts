/** @jest-environment node */

import { TICKET_PRIORITY, type TicketPriority } from '@/shared/constants';

/**
 * Jest 환경 검증용 샘플 서비스 테스트 (server / node).
 * - 파일 상단 @jest-environment node 주석이 node 환경으로 전환하는지 확인
 * - @/ 경로 별칭 동작 확인
 * - 순수 단위 로직(strict 준수) 동작 확인
 */
function normalizePriority(value: string): TicketPriority {
  const values = Object.values(TICKET_PRIORITY);
  return (values as readonly string[]).includes(value)
    ? (value as TicketPriority)
    : TICKET_PRIORITY.MEDIUM;
}

describe('Sample service test (jest config 검증)', () => {
  it('경로 별칭 @/shared/constants 로 값을 가져온다', () => {
    expect(TICKET_PRIORITY.HIGH).toBe('HIGH');
  });

  it('node 환경에서 순수 로직이 동작한다', () => {
    expect(normalizePriority('LOW')).toBe('LOW');
    expect(normalizePriority('unknown')).toBe('MEDIUM');
  });
});
