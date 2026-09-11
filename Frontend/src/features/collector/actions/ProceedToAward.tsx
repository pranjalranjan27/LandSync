import { ReasonModal } from '../../../components/ReasonModal/ReasonModal';

interface ProceedToAwardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function ProceedToAward({ isOpen, onClose, onConfirm }: ProceedToAwardProps) {
  return (
    <ReasonModal
      isOpen={isOpen}
      title="Sanction Section 23 Compensation & Solatium Award"
      actionName="Proceed to Award Disbursement"
      actionVariant="accent-kesari"
      onClose={onClose}
      onSubmit={onConfirm}
    />
  );
}
