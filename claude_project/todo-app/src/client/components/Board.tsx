import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Column } from '@/client/components/Column';
import { PriorityBadge } from '@/client/components/PriorityBadge';
import { TICKET_STATUS, type TicketStatus } from '@/shared/constants';
import type { Board as BoardData, TicketWithOverdue } from '@/shared/types/ticket';

const MAIN_STATUSES: TicketStatus[] = [
  TICKET_STATUS.TODO,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.DONE,
];

function findTicket(board: BoardData, id: number): TicketWithOverdue | null {
  for (const status of Object.keys(board) as TicketStatus[]) {
    const found = board[status].find((t) => t.id === id);
    if (found) return found;
  }
  return null;
}

export function Board({
  board,
  onTicketClick,
  onDragStart,
  onDragOver,
  onDragEnd,
  filterBar,
}: {
  board: BoardData;
  onTicketClick: (ticket: TicketWithOverdue) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  /** Rendered above board-main, to the right of the full-height Backlog sidebar (tika-wireframe.png). */
  filterBar?: React.ReactNode;
}) {
  const [activeTicket, setActiveTicket] = useState<TicketWithOverdue | null>(null);
  // dnd-kit's default PointerSensor has a 0px activation distance, so any sub-pixel
  // pointer jitter during a plain click gets misread as a drag start and the click
  // (onTicketClick) never fires. Require 8px of movement before a drag begins.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveTicket(findTicket(board, event.active.id as number));
    onDragStart?.(event);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTicket(null);
    onDragEnd?.(event);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="board-content">
        <aside className="board-sidebar">
          <Column
            status={TICKET_STATUS.BACKLOG}
            tickets={board.BACKLOG}
            onTicketClick={onTicketClick}
          />
        </aside>
        <div className="board-right">
          {filterBar}
          <div className="board-main">
            <div className="columns-container">
              {MAIN_STATUSES.map((status) => (
                <Column
                  key={status}
                  status={status}
                  tickets={board[status]}
                  onTicketClick={onTicketClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeTicket ? (
          <div className="ticket-card ticket-card--dragging">
            <p className="ticket-card-title">{activeTicket.title}</p>
            <div className="ticket-card-meta">
              <PriorityBadge priority={activeTicket.priority} />
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
