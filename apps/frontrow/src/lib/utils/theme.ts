/**
 * Theme color utilities for programmatic per-event theming
 * Uses OKLCH color space for better perceptual uniformity
 */

/**
 * Converts hex/rgb color to OKLCH for theme injection
 * Falls back to warm brown if no color provided
 */
export function normalizeThemeColor(color: string | undefined): string {
  if (!color) {
    return 'oklch(0.45 0.12 35)'; // Default warm brown
  }

  // If already OKLCH, return as-is
  if (color.startsWith('oklch(')) {
    return color;
  }

  // If hex, convert to OKLCH
  // For MVP, we require OKLCH in DB
  // Future: Add conversion library like culori if needed
  return color;
}

/**
 * Generate inline style object for theme injection
 * This is applied at the route level to set event-specific theme
 */
export function getThemeStyles(
  brandColor: string | undefined,
): React.CSSProperties {
  return {
    '--theme-accent': normalizeThemeColor(brandColor),
  } as React.CSSProperties;
}

