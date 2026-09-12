'use client';

/**
 * 컴포넌트 프리뷰 갤러리 — DB/서버 연결 없이 목 데이터로 개별 컴포넌트를 확인하는 페이지.
 * docs/FRONTEND_TASKS.md의 Phase 순서대로, 컴포넌트가 완성되는 대로 아래에
 * <PreviewSection> 블록을 추가한다. 프로덕션 라우트가 아니므로 다른 페이지에서
 * 링크하지 않는다 — `npm run dev` 후 http://localhost:3000/preview 로 직접 접근한다.
 */

import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { Badge } from '@/client/components/ui/Badge';
import { Button } from '@/client/components/ui/Button';
import { Modal } from '@/client/components/ui/Modal';
import { PriorityBadge } from '@/client/components/PriorityBadge';
import { DueDateBadge } from '@/client/components/DueDateBadge';
import { ConfirmDialog } from '@/client/components/ConfirmDialog';
import { ColumnHeader } from '@/client/components/ColumnHeader';
import { FilterBar, type BoardFilter } from '@/client/components/FilterBar';
import { BoardHeader } from '@/client/components/BoardHeader';
import { TicketCard } from '@/client/components/TicketCard';
import { Column } from '@/client/components/Column';
import type { TicketWithOverdue } from '@/shared/types/ticket';

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

const now = new Date();

function mockTicket(overrides: Partial<TicketWithOverdue> = {}): TicketWithOverdue {
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
    createdAt: now,
    updatedAt: now,
    isOverdue: false,
    ...overrides,
  };
}

const MOCK_TICKETS: TicketWithOverdue[] = [
  mockTicket({ id: 1, title: '평범한 티켓', priority: 'LOW' }),
  mockTicket({
    id: 2,
    title: '오버듀 티켓 (마감 지남)',
    priority: 'HIGH',
    dueDate: '2020-01-01',
    isOverdue: true,
  }),
  mockTicket({
    id: 3,
    title: '완료된 티켓',
    status: 'DONE',
    priority: 'MEDIUM',
    completedAt: now,
  }),
  mockTicket({
    id: 4,
    title:
      '아주 길어서 한 줄을 넘기는 제목 예시 — 말줄임(ellipsis) 처리가 되는지 확인하기 위한 더미 텍스트입니다',
    priority: 'HIGH',
    dueDate: '2026-12-31',
  }),
];

export default function PreviewPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [filter, setFilter] = useState<BoardFilter>('all');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tika 컴포넌트 프리뷰</h1>
        <p className="mt-1 text-sm text-gray-500">
          목 데이터로 렌더링하는 갤러리입니다. DB 연결이 필요 없으며, docs/FRONTEND_TASKS.md의
          Phase가 끝날 때마다 이 페이지에 섹션을 추가합니다.
        </p>
      </header>

      <div className="space-y-6">
        {/* Phase 1 — ui/Badge, ui/Button, ui/Modal */}
        <PreviewSection title="Phase 1 — Badge">
          <Badge>기본</Badge>
          <Badge variant="low">low</Badge>
          <Badge variant="medium">medium</Badge>
          <Badge variant="high">high</Badge>
          <Badge variant="due">due</Badge>
          <Badge variant="overdue">overdue</Badge>
        </PreviewSection>

        <PreviewSection title="Phase 1 — Button">
          <div className="flex w-full flex-col gap-4">
            <div>
              <p className="mb-1 text-xs text-gray-400">variant (4종류, 나란히)</p>
              <div className="flex items-center gap-2">
                <Button variant="primary">primary</Button>
                <Button variant="secondary">secondary</Button>
                <Button variant="danger">danger</Button>
                <Button variant="ghost">ghost</Button>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">size (variant=primary 기준)</p>
              <div className="flex items-center gap-2">
                <Button size="sm">sm</Button>
                <Button size="md">md</Button>
                <Button size="lg">lg</Button>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">상태</p>
              <div className="flex items-center gap-2">
                <Button isLoading>저장</Button>
                <Button disabled>비활성</Button>
              </div>
            </div>
          </div>
        </PreviewSection>

        <PreviewSection title="Phase 1 — Modal">
          <Button onClick={() => setIsModalOpen(true)}>모달 열기</Button>
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <div className="modal-header">
              <h3 className="font-semibold">샘플 모달</h3>
            </div>
            <div className="modal-body">
              <p>ESC 또는 바깥 영역 클릭으로 닫힙니다.</p>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                닫기
              </Button>
            </div>
          </Modal>
        </PreviewSection>

        {/* Phase 2 — PriorityBadge, DueDateBadge, ConfirmDialog, ColumnHeader, FilterBar, BoardHeader, TicketCard */}
        <PreviewSection title="Phase 2 — PriorityBadge">
          <PriorityBadge priority="LOW" />
          <PriorityBadge priority="MEDIUM" />
          <PriorityBadge priority="HIGH" />
        </PreviewSection>

        <PreviewSection title="Phase 2 — DueDateBadge">
          <DueDateBadge dueDate={null} isOverdue={false} />
          <DueDateBadge dueDate="2026-12-31" isOverdue={false} />
          <DueDateBadge dueDate="2020-01-01" isOverdue />
        </PreviewSection>

        <PreviewSection title="Phase 2 — ConfirmDialog">
          <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
            삭제 다이얼로그 열기
          </Button>
          <ConfirmDialog
            isOpen={isConfirmOpen}
            message="정말 삭제하시겠습니까?"
            onConfirm={() => setIsConfirmOpen(false)}
            onCancel={() => setIsConfirmOpen(false)}
          />
        </PreviewSection>

        <PreviewSection title="Phase 2 — ColumnHeader">
          <div className="w-64 rounded bg-gray-50">
            <ColumnHeader title="TODO" count={3} />
          </div>
          <div className="w-64 rounded bg-gray-50">
            <ColumnHeader title="Done" count={0} />
          </div>
        </PreviewSection>

        <PreviewSection title="Phase 2 — FilterBar">
          <FilterBar
            activeFilter={filter}
            onFilterChange={setFilter}
            counts={{ thisWeek: 2, overdue: 1 }}
          />
        </PreviewSection>

        <PreviewSection title="Phase 2 — BoardHeader">
          <div className="w-full">
            <BoardHeader onCreateClick={() => alert('새 업무 클릭')} />
          </div>
        </PreviewSection>

        <PreviewSection title="Phase 2 — TicketCard">
          <DndContext>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MOCK_TICKETS.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onClick={() => alert(`클릭: ${ticket.title}`)} />
              ))}
            </div>
          </DndContext>
        </PreviewSection>

        {/* Phase 3 — Column */}
        <PreviewSection title="Phase 3 — Column">
          <DndContext>
            <div className="flex w-full gap-3">
              <div className="w-72">
                <Column status="BACKLOG" tickets={MOCK_TICKETS} onTicketClick={(t) => alert(`클릭: ${t.title}`)} />
              </div>
              <div className="w-72">
                <Column status="DONE" tickets={[]} onTicketClick={() => {}} />
              </div>
            </div>
          </DndContext>
        </PreviewSection>

        {/* Phase 4 — TicketDetailView, TicketForm */}
        {/* Phase 5 — TicketModal */}
        {/* Phase 6 — Board */}
        {/* Phase 8 — BoardContainer */}
      </div>
    </div>
  );
}
