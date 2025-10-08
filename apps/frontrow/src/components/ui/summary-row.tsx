'use client';

interface SummaryRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  muted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SummaryRow({
  label,
  value,
  muted,
  size = 'md',
  className,
}: SummaryRowProps) {
  let sizeClasses = 'text-sm';
  if (size === 'sm') {
    sizeClasses = 'text-xs';
  } else if (size === 'lg') {
    sizeClasses = 'text-lg font-semibold';
  }
  const labelClasses = muted ? 'text-muted-foreground' : undefined;
  return (
    <div
      className={[
        'flex items-center justify-between',
        sizeClasses,
        className || '',
      ].join(' ')}
    >
      <span className={labelClasses}>{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
