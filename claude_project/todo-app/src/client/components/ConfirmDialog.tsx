import { Modal } from '@/client/components/ui/Modal';
import { Button } from '@/client/components/ui/Button';

export function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-footer">
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          확인
        </Button>
      </div>
    </Modal>
  );
}
