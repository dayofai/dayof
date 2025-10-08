'use client';

interface StatusDotProps {
  status?: 'default' | 'success' | 'muted';
  className?: string;
}

export function StatusDot({ status = 'default', className }: StatusDotProps) {
  let colorClass = 'bg-foreground';
  if (status === 'success') {
    colorClass = 'bg-green-500';
  } else if (status === 'muted') {
    colorClass = 'bg-muted';
  }
  return (
    <span
      className={['h-1.5 w-1.5 rounded-full', colorClass, className || ''].join(
        ' '
      )}
    />
  );
}
