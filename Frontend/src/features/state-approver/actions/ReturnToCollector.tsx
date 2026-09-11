import { ReasonModal } from '../../../components/ReasonModal/ReasonModal';

interface ReturnToCollectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function ReturnToCollector({ isOpen, onClose, onConfirm }: ReturnToCollectorProps) {
  return (
    <ReasonModal
      isOpen={isOpen}
      title="Return Case to District Collector with Queries"
      actionName="Return to Collector"
      actionVariant="secondary"
      onClose={onClose}
      onSubmit={onConfirm}
    />
  );
}
