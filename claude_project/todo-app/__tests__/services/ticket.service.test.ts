/** @jest-environment node */

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
  tickets: {},
}));

import { db } from '@/server/db';
import { createTicket } from '@/server/services/ticket.service';
import type { Ticket } from '@/shared/types/ticket';

function mockMinPosition(minPosition: number | null) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([{ minPosition }]),
    }),
  });
}

function mockInsertedRow(row: Partial<Ticket>) {
  const valuesMock = jest.fn().mockReturnValue({
    returning: jest.fn().mockResolvedValue([row]),
  });
  (db.insert as jest.Mock).mockReturnValue({ values: valuesMock });
  return valuesMock;
}

function lastInsertedValues(valuesMock: jest.Mock) {
  return valuesMock.mock.calls[valuesMock.mock.calls.length - 1][0];
}

describe('createTicket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('백로그가 비어있으면 position은 -1024이다', async () => {
    mockMinPosition(null);
    const valuesMock = mockInsertedRow({ id: 1, position: -1024 });

    await createTicket({ title: '제목' });

    expect(lastInsertedValues(valuesMock).position).toBe(-1024);
  });

  it('기존 최소 position이 -1024이면 새 position은 -2048이다', async () => {
    mockMinPosition(-1024);
    const valuesMock = mockInsertedRow({ id: 2, position: -2048 });

    await createTicket({ title: '제목' });

    expect(lastInsertedValues(valuesMock).position).toBe(-2048);
  });

  it('status는 입력값과 무관하게 항상 BACKLOG이다', async () => {
    mockMinPosition(0);
    const valuesMock = mockInsertedRow({ id: 3 });

    await createTicket({ title: '제목' });

    expect(lastInsertedValues(valuesMock).status).toBe('BACKLOG');
  });

  it('priority를 생략하면 MEDIUM으로 기본 설정된다', async () => {
    mockMinPosition(0);
    const valuesMock = mockInsertedRow({ id: 4 });

    await createTicket({ title: '제목' });

    expect(lastInsertedValues(valuesMock).priority).toBe('MEDIUM');
  });

  it('description, plannedStartDate, dueDate를 생략하면 null로 설정된다', async () => {
    mockMinPosition(0);
    const valuesMock = mockInsertedRow({ id: 5 });

    await createTicket({ title: '제목' });

    const inserted = lastInsertedValues(valuesMock);
    expect(inserted.description).toBeNull();
    expect(inserted.plannedStartDate).toBeNull();
    expect(inserted.dueDate).toBeNull();
  });

  it('startedAt과 completedAt은 항상 null로 설정된다', async () => {
    mockMinPosition(0);
    const valuesMock = mockInsertedRow({ id: 6 });

    await createTicket({ title: '제목' });

    const inserted = lastInsertedValues(valuesMock);
    expect(inserted.startedAt).toBeNull();
    expect(inserted.completedAt).toBeNull();
  });

  it('생성된 티켓 row를 그대로 반환한다', async () => {
    mockMinPosition(0);
    const row = { id: 7, title: '제목', position: -1024 };
    mockInsertedRow(row);

    const result = await createTicket({ title: '제목' });

    expect(result).toEqual(row);
  });
});
