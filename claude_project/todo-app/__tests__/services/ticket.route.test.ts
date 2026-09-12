/** @jest-environment node */

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
  tickets: {},
}));

import { db } from '@/server/db';
import { POST } from '@/app/api/tickets/route';

function mockMinPosition(minPosition: number | null) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([{ minPosition }]),
    }),
  });
}

function mockInsertedRow(row: Record<string, unknown>) {
  (db.insert as jest.Mock).mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([row]),
    }),
  });
}

const today = new Date().toISOString().split('T')[0];
const futureDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

function postRequest(body: unknown) {
  return new Request('http://localhost/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('제목만 보내면 201과 함께 기본값이 적용된 티켓을 반환한다', async () => {
    mockMinPosition(null);
    mockInsertedRow({
      id: 1,
      title: '첫 티켓',
      description: null,
      status: 'BACKLOG',
      priority: 'MEDIUM',
      position: -1024,
      plannedStartDate: null,
      dueDate: null,
      startedAt: null,
      completedAt: null,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    });

    const response = await POST(postRequest({ title: '첫 티켓' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.status).toBe('BACKLOG');
    expect(body.priority).toBe('MEDIUM');
    expect(body.plannedStartDate).toBeNull();
    expect(body.dueDate).toBeNull();
    expect(body.startedAt).toBeNull();
    expect(body.completedAt).toBeNull();
  });

  it('두 번째로 생성한 티켓의 position은 첫 번째보다 작다 (Backlog 맨 위에 위치)', async () => {
    mockMinPosition(null);
    mockInsertedRow({ id: 1, position: -1024 });
    const first = await POST(postRequest({ title: '첫 번째 티켓' }));
    const firstBody = await first.json();

    mockMinPosition(firstBody.position);
    mockInsertedRow({ id: 2, position: firstBody.position - 1024 });
    const second = await POST(postRequest({ title: '두 번째 티켓' }));
    const secondBody = await second.json();

    expect(secondBody.position).toBeLessThan(firstBody.position);
  });

  it('모든 필드를 채워 보내면 제출한 값을 그대로 돌려받는다', async () => {
    const fullInput = {
      title: 'API 설계 문서 작성',
      description: 'REST API 엔드포인트와 요청/응답 형식을 정의한다',
      priority: 'HIGH',
      plannedStartDate: today,
      dueDate: futureDueDate,
    };
    mockMinPosition(-1024);
    mockInsertedRow({
      id: 8,
      ...fullInput,
      status: 'BACKLOG',
      position: -2048,
      startedAt: null,
      completedAt: null,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    });

    const response = await POST(postRequest(fullInput));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.title).toBe(fullInput.title);
    expect(body.description).toBe(fullInput.description);
    expect(body.priority).toBe(fullInput.priority);
    expect(body.plannedStartDate).toBe(fullInput.plannedStartDate);
    expect(body.dueDate).toBe(fullInput.dueDate);
  });

  describe('검증 실패', () => {
    it.each([
      ['제목 누락', {}, '제목을 입력해주세요'],
      ['제목 공백만 입력', { title: '   ' }, '제목을 입력해주세요'],
      [
        '제목 200자 초과',
        { title: 'a'.repeat(201) },
        '제목은 200자 이내로 입력해주세요',
      ],
      [
        '설명 1000자 초과',
        { title: '제목', description: 'a'.repeat(1001) },
        '설명은 1000자 이내로 입력해주세요',
      ],
      [
        '잘못된 우선순위 값',
        { title: '제목', priority: 'URGENT' },
        '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요',
      ],
      [
        '과거 종료예정일',
        { title: '제목', dueDate: '2020-01-01' },
        '종료예정일은 오늘 이후 날짜를 선택해주세요',
      ],
    ])('%s → 400 VALIDATION_ERROR', async (_label, body, expectedMessage) => {
      const response = await POST(postRequest(body));
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody).toEqual({
        error: { code: 'VALIDATION_ERROR', message: expectedMessage },
      });
    });
  });
});
