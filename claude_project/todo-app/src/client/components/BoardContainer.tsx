'use client';

import { useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { BoardHeader } from '@/client/components/BoardHeader';
import { FilterBar, type BoardFilter } from '@/client/components/FilterBar';
import { Board } from '@/client/components/Board';
import { Modal } from '@/client/components/ui/Modal';
import { TicketForm } from '@/client/components/TicketForm';
import { TicketModal } from '@/client/components/TicketModal';
import { useTickets } from '@/client/hooks/useTickets';
import { calculatePosition } from '@/client/lib/position';
import { filterBoard, countForFilters } from '@/client/lib/board-filters';
import { TICKET_STATUS, type TicketStatus } from '@/shared/constants';
import type { Board as BoardData, ReorderTicketInput, TicketWithOverdue } from '@/shared/types/ticket';

function findTicket(board: BoardData, id: number): TicketWithOverdue | null {
  for (const status of Object.keys(board) as TicketStatus[]) {
    const found = board[status].find((t) => t.id === id);
    if (found) return found;
  }
  return null;
}

export function BoardContainer({ initialData }: { initialData: BoardData }) {
  const { board, create, update, remove, reorder, complete } = useTickets(initialData);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<BoardFilter>('all');

  const filteredBoard = filterBoard(board, activeFilter);
  const counts = countForFilters(board);
  const selectedTicket = selectedTicketId !== null ? findTicket(board, selectedTicketId) : null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overTicket = findTicket(board, Number(over.id));
    const targetStatus = (overTicket ? overTicket.status : over.id) as TicketStatus;

    if (targetStatus === TICKET_STATUS.DONE) {
      complete(activeId);
      return;
    }

    const destinationList = board[targetStatus].filter((t) => t.id !== activeId);
    const targetIndex =
      overTicket && overTicket.id !== activeId
        ? destinationList.findIndex((t) => t.id === overTicket.id)
        : destinationList.length;
    const position = calculatePosition(
      destinationList.map((t) => t.position),
      targetIndex
    );

    reorder(activeId, targetStatus as ReorderTicketInput['status'], position);
  }

  return (
    <div className="board-shell">
      <BoardHeader onCreateClick={() => setIsCreating(true)} />
      <Board
        board={filteredBoard}
        onTicketClick={(ticket) => setSelectedTicketId(ticket.id)}
        onDragEnd={handleDragEnd}
        filterBar={
          <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />
        }
      />

      <Modal isOpen={isCreating} onClose={() => setIsCreating(false)}>
        <div className="modal-header">
          <h2 className="modal-title">새 업무</h2>
        </div>
        <div className="modal-body">
          <TicketForm
            mode="create"
            isLoading={false}
            onCancel={() => setIsCreating(false)}
            onSubmit={async (data) => {
              const created = await create(data);
              if (created) setIsCreating(false);
            }}
          />
        </div>
      </Modal>

      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          isOpen
          onClose={() => setSelectedTicketId(null)}
          onUpdate={(id, data) => {
            update(id, data);
          }}
          onDelete={async (id) => {
            const removed = await remove(id);
            if (removed) setSelectedTicketId(null);
          }}
        />
      )}
    </div>
  );
}
