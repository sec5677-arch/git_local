import { calculatePosition } from '@/client/lib/position';

describe('calculatePosition', () => {
  it('대상 칼럼이 비어 있으면 1024를 반환한다', () => {
    expect(calculatePosition([], 0)).toBe(1024);
  });

  it('맨 앞(targetIndex=0)으로 이동하면 첫 티켓보다 1024 작은 값을 반환한다', () => {
    expect(calculatePosition([1024, 2048, 3072], 0)).toBe(0);
  });

  it('맨 뒤(targetIndex=length)로 이동하면 마지막 티켓보다 1024 큰 값을 반환한다', () => {
    expect(calculatePosition([1024, 2048, 3072], 3)).toBe(4096);
  });

  it('두 티켓 사이로 이동하면 두 position의 중간값을 반환한다', () => {
    expect(calculatePosition([1024, 2048, 3072], 1)).toBe(1536);
    expect(calculatePosition([1024, 2048, 3072], 2)).toBe(2560);
  });

  it('중간값이 정수가 아니면 내림한 정수를 반환한다', () => {
    expect(calculatePosition([1024, 1025], 1)).toBe(1024);
  });

  it('targetIndex가 범위를 벗어나면(음수) 맨 앞으로 취급한다', () => {
    expect(calculatePosition([1024, 2048], -1)).toBe(0);
  });

  it('targetIndex가 범위를 벗어나면(길이 초과) 맨 뒤로 취급한다', () => {
    expect(calculatePosition([1024, 2048], 99)).toBe(3072);
  });
});
