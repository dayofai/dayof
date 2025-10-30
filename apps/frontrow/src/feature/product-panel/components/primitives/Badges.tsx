import { Badge } from '@/components/ui/badge';
import type { Badge as BadgeType } from '../../schemas';

interface BadgesProps {
  badges: BadgeType[];
  className?: string;
  maxVisible?: number;
}

/**
 * Badges component for displaying product labels
 *
 * Renders badges with server-provided styling (variants or OKLCH colors).
 * Supports limiting visible badges with "+N more" overflow.
 *
 * Server provides variant information; client just renders.
 *
 * @example
 * ```tsx
 * <Badges badges={[
 *   { label: 'Featured', variant: 'primary' },
 *   { label: 'Limited', variant: 'warning' }
 * ]} />
 *
 * <Badges badges={badges} maxVisible={3} />
 * // Shows: first 3 badges, +N more
 * ```
 */
export function Badges({ badges, className = '', maxVisible }: BadgesProps) {
  if (!badges || badges.length === 0) {
    return null;
  }

  const visibleBadges =
    maxVisible && badges.length > maxVisible
      ? badges.slice(0, maxVisible)
      : badges;

  const hiddenCount =
    maxVisible && badges.length > maxVisible ? badges.length - maxVisible : 0;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {visibleBadges.map((badge) => (
        <Badge
          className="text-xs"
          key={badge.label}
          // @ts-expect-error - variant can be OKLCH string which Badge handles
          variant={badge.variant}
        >
          {badge.label}
        </Badge>
      ))}

      {hiddenCount > 0 && (
        <Badge className="text-xs" variant="outline">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
}
