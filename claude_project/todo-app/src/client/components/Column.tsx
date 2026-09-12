import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ColumnHeader } from '@/client/components/ColumnHeader';
import { TicketCard } from '@/client/components/TicketCard';
import type { TicketStatus } from '@/shared/constants';
import type { TicketWithOverdue } from '@/shared/types/ticket';

const COLUMN_LABEL: Record<TicketStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'TODO',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export function Column({
  status,
  tickets,
  onTicketClick,
}: {
  status: TicketStatus;
  tickets: TicketWithOverdue[];
  onTicketClick: (ticket: TicketWithOverdue) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="column" data-status={status}>
      <ColumnHeader title={COLUMN_LABEL[status]} count={tickets.length} />
      <SortableContext
        items={tickets.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="column-body" ref={setNodeRef}>
          {tickets.length === 0 ? (
            <p className="column-empty">이 칼럼에 티켓이 없습니다</p>
          ) : (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => onTicketClick(ticket)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
