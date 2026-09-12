import { Badge } from '@/client/components/ui/Badge';

export function DueDateBadge({
  dueDate,
  isOverdue,
}: {
  dueDate: string | null;
  isOverdue: boolean;
}) {
  if (!dueDate) return null;

  return <Badge variant={isOverdue ? 'overdue' : 'due'}>{dueDate}</Badge>;
}
