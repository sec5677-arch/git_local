'use client';

import { useState } from 'react';
import { Modal } from '@/client/components/ui/Modal';
import { Button } from '@/client/components/ui/Button';
import { TicketDetailView } from '@/client/components/TicketDetailView';
import { TicketForm } from '@/client/components/TicketForm';
import { ConfirmDialog } from '@/client/components/ConfirmDialog';
import type { TicketWithOverdue, UpdateTicketInput } from '@/shared/types/ticket';

export function TicketModal({
  ticket,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: {
  ticket: TicketWithOverdue;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: UpdateTicketInput) => void;
  onDelete: (id: number) => void;
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="modal-header">
          <h2 className="modal-title">{ticket.title}</h2>
          <Button variant="danger" size="sm" onClick={() => setIsConfirmingDelete(true)}>
            삭제
          </Button>
        </div>
        <div className="modal-body space-y-4">
          <TicketDetailView ticket={ticket} />
          <TicketForm
            mode="edit"
            initialData={ticket}
            isLoading={false}
            onCancel={onClose}
            onSubmit={(data) => onUpdate(ticket.id, data)}
          />
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={isConfirmingDelete}
        message="정말 삭제하시겠습니까?"
        onConfirm={() => {
          setIsConfirmingDelete(false);
          onDelete(ticket.id);
        }}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </>
  );
}
