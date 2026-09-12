import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PriorityBadge } from '@/client/components/PriorityBadge';
import { DueDateBadge } from '@/client/components/DueDateBadge';
import type { TicketWithOverdue } from '@/shared/types/ticket';

export function TicketCard({
  ticket,
  onClick,
}: {
  ticket: TicketWithOverdue;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const classNames = [
    'ticket-card',
    ticket.isOverdue && 'ticket-card--overdue',
    ticket.status === 'DONE' && 'ticket-card--done',
    isDragging && 'ticket-card--dragging',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      className={classNames}
      aria-label={`티켓: ${ticket.title}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onClick();
      }}
    >
      <p className="ticket-card-title">{ticket.title}</p>
      <div className="ticket-card-meta">
        <PriorityBadge priority={ticket.priority} />
        <DueDateBadge dueDate={ticket.dueDate} isOverdue={ticket.isOverdue} />
      </div>
    </div>
  );
}
