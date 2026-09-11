import { ReasonModal } from '../../../components/ReasonModal/ReasonModal';

interface ApproveForwardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function ApproveForward({ isOpen, onClose, onConfirm }: ApproveForwardProps) {
  return (
    <ReasonModal
      isOpen={isOpen}
      title="Statutory Approval & Forward to State SIA"
      actionName="Approve &amp; Forward"
      actionVariant="primary"
      onClose={onClose}
      onSubmit={onConfirm}
    />
  );
}
