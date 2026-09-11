import { ReasonModal } from '../../../components/ReasonModal/ReasonModal';

interface ApproveForwardToSIAProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function ApproveForwardToSIA({ isOpen, onClose, onConfirm }: ApproveForwardToSIAProps) {
  return (
    <ReasonModal
      isOpen={isOpen}
      title="Sanction Social Impact Assessment Commission (SIA)"
      actionName="Approve &amp; Commission SIA"
      actionVariant="primary"
      onClose={onClose}
      onSubmit={onConfirm}
    />
  );
}
