import { Badge, type BadgeVariant } from '@/client/components/ui/Badge';
import type { TicketPriority } from '@/shared/constants';

const PRIORITY_VARIANT: Record<TicketPriority, BadgeVariant> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
