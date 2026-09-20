import type { ComponentPropsWithoutRef } from 'react';

export type BadgeVariant = 'low' | 'medium' | 'high' | 'due' | 'overdue';

export function Badge({
  variant,
  children,
  ...rest
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
} & ComponentPropsWithoutRef<'span'>) {
  const variantClass = variant ? `badge--${variant}` : '';
  return (
    <span className={`badge ${variantClass}`.trim()} {...rest}>
      {children}
    </span>
  );
}
