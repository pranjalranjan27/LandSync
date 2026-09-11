import { ReasonModal } from '../../../components/ReasonModal/ReasonModal';

interface PublishNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function PublishNotification({ isOpen, onClose, onConfirm }: PublishNotificationProps) {
  return (
    <ReasonModal
      isOpen={isOpen}
      title="Publish Section 11(1) Preliminary Gazette Notification"
      actionName="Issue Official Gazette Notification"
      actionVariant="primary"
      onClose={onClose}
      onSubmit={onConfirm}
    />
  );
}
