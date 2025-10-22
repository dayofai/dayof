/**
 * Brand Color Resolution Logic
 *
 * Resolves which brand color to use based on priority:
 * 1. Manual theme colors (user override)
 * 2. Extracted colors from cover image
 * 3. Fallback default
 *
 * This matches Luma's resolution strategy.
 */

export type ThemeMode = "auto" | "manual";

export interface EventThemeData {
	themeMode?: ThemeMode | null;
	themeBrandColor?: string | null;
	themeColors?: {
		primary?: string;
		secondary?: string;
		accent?: string;
	} | null;
	coverExtractedColors?: string[] | null;
}

export interface ResolvedBrandColor {
	mode: ThemeMode;
	primary: string;
	secondary?: string;
	accent?: string;
	source:
		| "manual-advanced"
		| "manual-simple"
		| "extracted"
		| "extracted-fallback"
		| "default";
}

const DEFAULT_BRAND = "#737373"; // Neutral gray-50

/**
 * Resolve which brand color to use with fallback chain
 *
 * Priority order:
 * 1. Manual multi-color (highest specificity)
 * 2. Manual single color
 * 3. Auto-extracted from cover (if mode is auto)
 * 4. Extracted colors (even if mode is manual but no manual color set)
 * 5. Global default (neutral gray)
 *
 * @example
 * // Manual override takes precedence
 * const event = { themeMode: 'manual', themeBrandColor: '#ff0000' };
 * const resolved = resolveBrandColors(event);
 * // { mode: 'manual', primary: '#ff0000', source: 'manual-simple' }
 *
 * @example
 * // Auto uses extracted colors
 * const event = { themeMode: 'auto', coverExtractedColors: ['#502aac', '#8f73cf'] };
 * const resolved = resolveBrandColors(event);
 * // { mode: 'auto', primary: '#502aac', secondary: '#8f73cf', source: 'extracted' }
 */
export function resolveBrandColors(event: EventThemeData): ResolvedBrandColor {
	// Priority 1: Manual multi-color (advanced mode with gradients)
	if (event.themeMode === "manual" && event.themeColors?.primary) {
		return {
			mode: "manual",
			primary: event.themeColors.primary,
			secondary: event.themeColors.secondary,
			accent: event.themeColors.accent,
			source: "manual-advanced",
		};
	}

	// Priority 2: Manual single color (simple mode)
	if (event.themeMode === "manual" && event.themeBrandColor) {
		return {
			mode: "manual",
			primary: event.themeBrandColor,
			source: "manual-simple",
		};
	}

	// Priority 3: Auto-extracted from cover (when mode is explicitly auto)
	if (event.themeMode === "auto" && event.coverExtractedColors?.length) {
		return {
			mode: "auto",
			primary: event.coverExtractedColors[0],
			secondary: event.coverExtractedColors[1],
			accent: event.coverExtractedColors[2],
			source: "extracted",
		};
	}

	// Priority 4: Extracted colors as fallback (mode is manual but no manual color)
	if (event.coverExtractedColors?.length) {
		return {
			mode: "auto",
			primary: event.coverExtractedColors[0],
			source: "extracted-fallback",
		};
	}

	// Priority 5: Global default (neutral gray)
	return {
		mode: "auto",
		primary: DEFAULT_BRAND,
		source: "default",
	};
}

/**
 * Generate theme CSS with resolved colors
 * Convenience wrapper that combines resolution + generation
 */
export function generateEventTheme(
	eventId: string,
	event: EventThemeData,
	generateFn: (scopeClass: string, brandColor: string) => string,
): { css: string; colors: ResolvedBrandColor } {
	const colors = resolveBrandColors(event);
	const css = generateFn(`.event-${eventId}`, colors.primary);

	return { css, colors };
}
