import {
  Badge as BaseBadge,
  type BadgeProps as BaseBadgeProps,
} from '@/components/vendor/reui/base-badge';

// Extended Badge props with OKLCH support
export interface BadgeProps extends BaseBadgeProps {
  /**
   * Custom OKLCH color (e.g., "oklch(0.7 0.3 180)")
   * When provided, overrides variant styling with custom color
   */
  oklch?: string;
}

/**
 * Badge component with OKLCH color support
 *
 * Extends the base Badge with custom OKLCH color capability.
 * Automatically detects OKLCH colors in variant prop and applies custom styling.
 */
export function Badge({
  oklch,
  variant,
  appearance,
  style,
  ...props
}: BadgeProps) {
  // Check if variant is an OKLCH color string
  const isOklchVariant =
    typeof variant === 'string' && variant.startsWith('oklch(');
  const effectiveOklch = oklch || (isOklchVariant ? variant : undefined);

  // If OKLCH color is provided (via oklch prop or variant), use outline variant with custom colors
  if (effectiveOklch) {
    return (
      <BaseBadge
        appearance="default"
        style={{
          backgroundColor: effectiveOklch,
          borderColor: effectiveOklch,
          color: 'white',
          ...style,
        }}
        variant="outline"
        {...props}
      />
    );
  }

  // Otherwise, use standard badge
  return (
    <BaseBadge
      appearance={appearance}
      style={style}
      variant={variant}
      {...props}
    />
  );
}

// Re-export other components and types
export type {
  BadgeButtonProps,
  BadgeDotProps,
} from '@/components/vendor/reui/base-badge';

export {
  BadgeButton,
  BadgeDot,
  badgeVariants,
} from '@/components/vendor/reui/base-badge';
