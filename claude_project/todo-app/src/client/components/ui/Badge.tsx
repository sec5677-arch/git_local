export type BadgeVariant = 'low' | 'medium' | 'high' | 'due' | 'overdue';

export function Badge({
  variant,
  children,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  const variantClass = variant ? `badge--${variant}` : '';
  return <span className={`badge ${variantClass}`.trim()}>{children}</span>;
}
