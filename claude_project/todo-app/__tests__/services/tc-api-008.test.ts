/**
 * @jest-environment node
 *
 * docs/TEST_CASES.md § TC-API-008 (isOverdue 필드 계산) 008-1 ~ 008-7
 * Verified through GET /api/tickets/:id, which exposes the shared
 * computeIsOverdue() logic also used by GET /api/tickets (board).
 */

jest.mock('@/server/db', () => ({
  db: { select: jest.fn() },
  tickets: {},
}));

import { db } from '@/server/db';
import { GET } from '@/app/api/tickets/[id]/route';

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: '제목',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    position: 1,
    plannedStartDate: null,
    dueDate: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function mockTicket(ticketRow: Record<string, unknown>) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([ticketRow]),
    }),
  });
}

async function isOverdueFor(overrides: Record<string, unknown>) {
  mockTicket(row(overrides));
  const response = await GET(new Request('http://localhost/api/tickets/1'), ctx('1'));
  const body = await response.json();
  return body.isOverdue;
}

const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];
const today = new Date().toISOString().split('T')[0];

describe('TC-API-008: isOverdue 필드 계산', () => {
  beforeEach(() => jest.clearAllMocks());

  it('008-1 오버듀 판정: dueDate < 오늘, status=TODO → true', async () => {
    expect(await isOverdueFor({ status: 'TODO', dueDate: yesterday })).toBe(true);
  });

  it('008-2 DONE은 오버듀 아님: dueDate < 오늘, status=DONE → false', async () => {
    expect(await isOverdueFor({ status: 'DONE', dueDate: yesterday })).toBe(false);
  });

  it('008-3 종료예정일 없음: dueDate = null → false', async () => {
    expect(await isOverdueFor({ status: 'TODO', dueDate: null })).toBe(false);
  });

  it('008-4 미래 종료예정일: dueDate > 오늘 → false', async () => {
    expect(await isOverdueFor({ status: 'TODO', dueDate: tomorrow })).toBe(false);
  });

  it('008-5 오늘이 종료예정일: dueDate = 오늘 → false (오늘은 아직 초과 아님)', async () => {
    expect(await isOverdueFor({ status: 'TODO', dueDate: today })).toBe(false);
  });

  it('008-6 BACKLOG 오버듀: dueDate < 오늘, status=BACKLOG → true', async () => {
    expect(await isOverdueFor({ status: 'BACKLOG', dueDate: yesterday })).toBe(true);
  });

  it('008-7 IN_PROGRESS 오버듀: dueDate < 오늘, status=IN_PROGRESS → true', async () => {
    expect(await isOverdueFor({ status: 'IN_PROGRESS', dueDate: yesterday })).toBe(true);
  });
});
