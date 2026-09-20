import type { Ticket } from '@/shared/types/ticket';
import type { TicketStatus } from '@/shared/constants';

const STATUS_LABEL: Record<TicketStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'TODO',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Date(date).toISOString().split('T')[0];
}

export function TicketDetailView({ ticket }: { ticket: Ticket }) {
  return (
    <dl className="space-y-2 text-xs">
      <div className="flex justify-between">
        <dt className="text-slate-500">상태</dt>
        <dd className="text-slate-900">{STATUS_LABEL[ticket.status as TicketStatus]}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-500">시작일</dt>
        <dd className="text-slate-900">{formatDate(ticket.startedAt)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-500">종료일</dt>
        <dd className="text-slate-900">{formatDate(ticket.completedAt)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-500">생성일</dt>
        <dd className="text-slate-900">{formatDate(ticket.createdAt)}</dd>
      </div>
    </dl>
  );
}
