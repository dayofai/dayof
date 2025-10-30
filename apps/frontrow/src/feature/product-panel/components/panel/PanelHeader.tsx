interface PanelHeaderProps {
  welcomeText?: string | null;
  className?: string;
}

/**
 * PanelHeader - Displays server-provided welcome text
 *
 * Per spec §5: welcomeText comes from context.welcomeText (server-provided).
 * No client-invented copy.
 */
export function PanelHeader({ welcomeText, className = '' }: PanelHeaderProps) {
  if (!welcomeText) {
    return null;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <h2 className="font-semibold text-lg leading-tight">{welcomeText}</h2>
    </div>
  );
}
