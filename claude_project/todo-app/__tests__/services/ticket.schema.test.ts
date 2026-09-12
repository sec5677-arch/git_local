/** @jest-environment node */

import { createTicketSchema } from '@/shared/validations/ticket';

const today = new Date().toISOString().split('T')[0];
const futureDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

describe('createTicketSchema', () => {
  it('제목만 있어도 통과한다', () => {
    const result = createTicketSchema.safeParse({ title: '첫 티켓' });
    expect(result.success).toBe(true);
  });

  it('모든 필드가 유효하면 통과한다', () => {
    const result = createTicketSchema.safeParse({
      title: 'API 설계 문서 작성',
      description: 'REST API 엔드포인트와 요청/응답 형식을 정의한다',
      priority: 'HIGH',
      plannedStartDate: today,
      dueDate: futureDueDate,
    });
    expect(result.success).toBe(true);
  });

  it('제목이 없으면 실패한다', () => {
    const result = createTicketSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('제목을 입력해주세요');
    }
  });

  it('제목이 공백만 있으면 실패한다', () => {
    const result = createTicketSchema.safeParse({ title: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('제목을 입력해주세요');
    }
  });

  it('제목이 200자를 초과하면 실패한다', () => {
    const result = createTicketSchema.safeParse({ title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '제목은 200자 이내로 입력해주세요'
      );
    }
  });

  it('설명이 1000자를 초과하면 실패한다', () => {
    const result = createTicketSchema.safeParse({
      title: '제목',
      description: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '설명은 1000자 이내로 입력해주세요'
      );
    }
  });

  it('우선순위가 유효하지 않으면 실패한다', () => {
    const result = createTicketSchema.safeParse({
      title: '제목',
      priority: 'URGENT',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요'
      );
    }
  });

  it('종료예정일이 오늘 이전이면 실패한다', () => {
    const result = createTicketSchema.safeParse({
      title: '제목',
      dueDate: '2020-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '종료예정일은 오늘 이후 날짜를 선택해주세요'
      );
    }
  });
});
