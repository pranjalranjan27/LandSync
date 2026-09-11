import type { Case } from '../../types/case';
import { AuditLogFeed } from '../../components/AuditLogFeed/AuditLogFeed';

interface TimelineTabProps {
  caseItem: Case;
}

export function TimelineTab({ caseItem }: TimelineTabProps) {
  return (
    <div>
      <AuditLogFeed logs={caseItem.auditTrail} />
    </div>
  );
}
