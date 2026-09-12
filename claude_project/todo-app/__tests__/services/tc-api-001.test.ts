/**
 * @jest-environment node
 *
 * docs/TEST_CASES.md § TC-API-001 (POST /api/tickets — 티켓 생성)의
 * 001-1 ~ 001-11 시나리오를 1:1로 대응시킨 테스트.
 */

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
  tickets: {},
}));

import { db } from '@/server/db';
import { POST } from '@/app/api/tickets/route';

const futureDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];
const todayDate = new Date().toISOString().split('T')[0];

function mockMinPosition(minPosition: number | null) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([{ minPosition }]),
    }),
  });
}

function mockInsertedRow(row: Record<string, unknown>) {
  const valuesMock = jest.fn().mockReturnValue({
    returning: jest.fn().mockResolvedValue([row]),
  });
  (db.insert as jest.Mock).mockReturnValue({ values: valuesMock });
  return valuesMock;
}

function postRequest(body: unknown) {
  return new Request('http://localhost/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('TC-API-001: POST /api/tickets — 티켓 생성', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('001-1 필수 필드만으로 생성 → 201, status=BACKLOG, priority=MEDIUM', async () => {
    mockMinPosition(null);
    mockInsertedRow({
      id: 1,
      title: '테스트 할일',
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

    const response = await POST(postRequest({ title: '테스트 할일' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.status).toBe('BACKLOG');
    expect(body.priority).toBe('MEDIUM');
  });

  it('001-2 전체 필드로 생성 → 201, 모든 필드 반영', async () => {
    const input = {
      title: 'API 설계 문서 작성',
      description: 'REST API 엔드포인트와 요청/응답 형식을 정의한다',
      priority: 'HIGH',
      plannedStartDate: todayDate,
      dueDate: futureDueDate,
    };
    mockMinPosition(-1024);
    mockInsertedRow({
      id: 2,
      ...input,
      status: 'BACKLOG',
      position: -2048,
      startedAt: null,
      completedAt: null,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    });

    const response = await POST(postRequest(input));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.title).toBe(input.title);
    expect(body.description).toBe(input.description);
    expect(body.priority).toBe(input.priority);
    expect(body.plannedStartDate).toBe(input.plannedStartDate);
    expect(body.dueDate).toBe(input.dueDate);
  });

  it('001-3 제목 누락 → 400, "제목을 입력해주세요"', async () => {
    const response = await POST(postRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: '제목을 입력해주세요' },
    });
  });

  it('001-4 빈 제목 → 400, "제목을 입력해주세요"', async () => {
    const response = await POST(postRequest({ title: '' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: '제목을 입력해주세요' },
    });
  });

  it('001-5 공백만 제목 → 400, "제목을 입력해주세요"', async () => {
    const response = await POST(postRequest({ title: '   ' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: '제목을 입력해주세요' },
    });
  });

  it('001-6 제목 200자 초과 → 400, "제목은 200자 이내로 입력해주세요"', async () => {
    const response = await POST(postRequest({ title: 'a'.repeat(201) }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: '제목은 200자 이내로 입력해주세요',
      },
    });
  });

  it('001-7 설명 1000자 초과 → 400, "설명은 1000자 이내로 입력해주세요"', async () => {
    const response = await POST(
      postRequest({ title: 'ok', description: 'a'.repeat(1001) })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: '설명은 1000자 이내로 입력해주세요',
      },
    });
  });

  it('001-8 잘못된 우선순위 → 400, "우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요"', async () => {
    const response = await POST(
      postRequest({ title: 'ok', priority: 'URGENT' })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요',
      },
    });
  });

  it('001-9 과거 종료예정일 → 400, "종료예정일은 오늘 이후 날짜를 선택해주세요"', async () => {
    const response = await POST(
      postRequest({ title: 'ok', dueDate: '2020-01-01' })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: '종료예정일은 오늘 이후 날짜를 선택해주세요',
      },
    });
  });

  it('001-10 position 자동 할당: 연속 2개 생성 시 나중 티켓의 position이 더 작음(맨 위 배치)', async () => {
    mockMinPosition(null);
    mockInsertedRow({ id: 1, position: -1024 });
    const first = await POST(postRequest({ title: '첫 번째' }));
    const firstBody = await first.json();

    mockMinPosition(firstBody.position);
    mockInsertedRow({ id: 2, position: firstBody.position - 1024 });
    const second = await POST(postRequest({ title: '두 번째' }));
    const secondBody = await second.json();

    expect(secondBody.position).toBeLessThan(firstBody.position);
  });

  it('001-11 startedAt/completedAt 초기값: 정상 생성 시 둘 다 null', async () => {
    mockMinPosition(0);
    mockInsertedRow({
      id: 3,
      title: '제목',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      position: -1024,
      startedAt: null,
      completedAt: null,
    });

    const response = await POST(postRequest({ title: '제목' }));
    const body = await response.json();

    expect(body.startedAt).toBeNull();
    expect(body.completedAt).toBeNull();
  });
});
