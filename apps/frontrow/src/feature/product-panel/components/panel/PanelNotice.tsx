import { AlertTriangle, Info, Lock, XCircle } from 'lucide-react';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/vendor/reui/alert';
import type { Notice } from '../../schemas';

interface PanelNoticeProps {
  notice: Notice;
  className?: string;
}

/**
 * PanelNotice - Renders a single panel-level notice
 *
 * Displays server-provided notices with appropriate variant styling.
 * Supports standard text notices and specialized variants (e.g., access code entry).
 *
 * Per spec §5: Panel notices are the only panel-level text channel.
 * All copy comes from the server; no client-invented text.
 */
export function PanelNotice({ notice, className = '' }: PanelNoticeProps) {
  // Omit notice if no displayable text
  const hasContent = notice.text || notice.title || notice.description;
  if (!hasContent) {
    return null;
  }

  // Map notice variant to Alert variant
  const variantMap = {
    neutral: 'secondary' as const,
    info: 'info' as const,
    warning: 'warning' as const,
    error: 'destructive' as const,
  };

  // Map icons (optional server-provided icon field)
  const iconMap = {
    lock: Lock,
    info: Info,
    warning: AlertTriangle,
    error: XCircle,
  };

  const alertVariant = variantMap[notice.variant];
  const IconComponent = notice.icon
    ? iconMap[notice.icon as keyof typeof iconMap]
    : null;

  return (
    <Alert
      appearance="outline"
      className={className}
      icon={notice.variant}
      variant={alertVariant}
    >
      {IconComponent && (
        <AlertIcon>
          <IconComponent />
        </AlertIcon>
      )}

      <AlertContent>
        {notice.title && <AlertTitle>{notice.title}</AlertTitle>}

        {notice.text && <AlertDescription>{notice.text}</AlertDescription>}

        {notice.description && (
          <AlertDescription className="text-muted-foreground">
            {notice.description}
          </AlertDescription>
        )}

        {/* TODO: Implement notice.action (link/drawer) */}
        {/* TODO: Implement specialized notice types (requires_code_entry with inline form) */}
      </AlertContent>
    </Alert>
  );
}

interface PanelNoticesProps {
  notices: Notice[];
  className?: string;
}

/**
 * PanelNotices - Renders all panel notices in priority order
 */
export function PanelNotices({ notices, className = '' }: PanelNoticesProps) {
  if (!notices || notices.length === 0) {
    return null;
  }

  const sortedNotices = [...notices].sort((a, b) => {
    const priorityA = a.priority ?? 0;
    const priorityB = b.priority ?? 0;
    return priorityB - priorityA;
  });

  return (
    <div className={`space-y-2 ${className}`}>
      {sortedNotices.map((notice) => (
        <PanelNotice key={notice.code} notice={notice} />
      ))}
    </div>
  );
}
