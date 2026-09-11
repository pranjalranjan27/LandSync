import { ReasonModal } from '../../../components/ReasonModal/ReasonModal';

interface RejectProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function Reject({ isOpen, onClose, onConfirm }: RejectProps) {
  return (
    <ReasonModal
      isOpen={isOpen}
      title="Statutory Rejection of Land Acquisition Proposal"
      actionName="Formally Reject Proposal"
      actionVariant="secondary"
      onClose={onClose}
      onSubmit={onConfirm}
    />
  );
}
