import { ReasonModal } from '../../../components/ReasonModal/ReasonModal';

interface RequestClarificationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function RequestClarification({ isOpen, onClose, onConfirm }: RequestClarificationProps) {
  return (
    <ReasonModal
      isOpen={isOpen}
      title="Request Cadastral / Survey Clarification"
      actionName="Issue Clarification Query"
      actionVariant="accent-kesari"
      onClose={onClose}
      onSubmit={onConfirm}
    />
  );
}
