/** @jest-environment node */

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  tickets: {},
}));

import { db } from '@/server/db';
import {
  updateTicket,
  completeTicket,
  deleteTicket,
} from '@/server/services/ticket.service';

function mockUpdateResult(row: Record<string, unknown> | undefined) {
  const setMock = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue(row ? [row] : []),
    }),
  });
  (db.update as jest.Mock).mockReturnValue({ set: setMock });
  return setMock;
}

function mockMinPosition(minPosition: number | null) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([{ minPosition }]),
    }),
  });
}

function mockDeleteResult(rows: { id: number }[]) {
  (db.delete as jest.Mock).mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue(rows),
    }),
  });
}

describe('updateTicket', () => {
  beforeEach(() => jest.clearAllMocks());

  it('전송된 필드만 업데이트 대상에 포함한다', async () => {
    const setMock = mockUpdateResult({ id: 1, title: '새 제목' });

    await updateTicket(1, { title: '새 제목' });

    const setArg = setMock.mock.calls[0][0];
    expect(setArg.title).toBe('새 제목');
    expect('description' in setArg).toBe(false);
    expect('priority' in setArg).toBe(false);
    expect('plannedStartDate' in setArg).toBe(false);
    expect('dueDate' in setArg).toBe(false);
  });

  it('description: null을 보내면 삭제(=null 설정)로 처리한다', async () => {
    const setMock = mockUpdateResult({ id: 1, description: null });

    await updateTicket(1, { description: null });

    expect(setMock.mock.calls[0][0].description).toBeNull();
  });

  it('updatedAt을 항상 갱신한다', async () => {
    const setMock = mockUpdateResult({ id: 1 });

    await updateTicket(1, { title: '제목' });

    expect(setMock.mock.calls[0][0].updatedAt).toBeInstanceOf(Date);
  });

  it('존재하지 않는 티켓이면 null을 반환한다', async () => {
    mockUpdateResult(undefined);

    const result = await updateTicket(999, { title: '제목' });

    expect(result).toBeNull();
  });
});

describe('completeTicket', () => {
  beforeEach(() => jest.clearAllMocks());

  it('status를 DONE으로, completedAt을 현재 시각으로 설정한다', async () => {
    mockMinPosition(null);
    const setMock = mockUpdateResult({ id: 1, status: 'DONE' });

    await completeTicket(1);

    const setArg = setMock.mock.calls[0][0];
    expect(setArg.status).toBe('DONE');
    expect(setArg.completedAt).toBeInstanceOf(Date);
  });

  it('position은 Done 칼럼의 min(position) - 1024로 설정한다', async () => {
    mockMinPosition(-1024);
    const setMock = mockUpdateResult({ id: 1 });

    await completeTicket(1);

    expect(setMock.mock.calls[0][0].position).toBe(-2048);
  });

  it('존재하지 않는 티켓이면 null을 반환한다', async () => {
    mockMinPosition(null);
    mockUpdateResult(undefined);

    const result = await completeTicket(999);

    expect(result).toBeNull();
  });
});

describe('deleteTicket', () => {
  beforeEach(() => jest.clearAllMocks());

  it('삭제된 행이 있으면 true를 반환한다', async () => {
    mockDeleteResult([{ id: 1 }]);

    const result = await deleteTicket(1);

    expect(result).toBe(true);
  });

  it('존재하지 않는 티켓이면 false를 반환한다', async () => {
    mockDeleteResult([]);

    const result = await deleteTicket(999);

    expect(result).toBe(false);
  });
});
