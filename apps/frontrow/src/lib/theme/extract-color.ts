/**
 * Server-Side Color Extraction from Images
 *
 * Uses node-vibrant to extract dominant colors from event cover images.
 * Call this in backstage when a cover is uploaded, then save the
 * extracted hex to the database.
 *
 * NOTE: This should ONLY run server-side. Do not import in client code.
 */

/**
 * Extract dominant brand color from an image
 *
 * Priority order:
 * 1. Vibrant (high saturation, bright)
 * 2. Muted (mid saturation)
 * 3. LightVibrant (fallback)
 * 4. DarkVibrant (fallback)
 * 5. Any available swatch
 *
 * @param imagePathOrUrl - Local path or URL to image
 * @returns Hex color string (e.g., "#7646ad")
 *
 * @example
 * // Server-side usage (e.g., in backstage upload handler)
 * const brandColor = await extractBrandColorFromImage('./cover.jpg');
 * await db.event.update({
 *   where: { id: eventId },
 *   data: {
 *     brandColor,
 *     themeMode: 'auto'
 *   }
 * });
 */
export async function extractBrandColorFromImage(
	imagePathOrUrl: string,
): Promise<string> {
	// Dynamic import to avoid bundling in client
	// node-vibrant v4 uses subpath exports for server-side
	const { Vibrant } = await import("node-vibrant/node");

	const palette = await Vibrant.from(imagePathOrUrl).getPalette();

	// Prefer vibrant colors, fallback to muted if vibrant is too extreme
	const swatch =
		palette.Vibrant ??
		palette.Muted ??
		palette.LightVibrant ??
		palette.DarkVibrant ??
		palette.LightMuted ??
		palette.DarkMuted;

	if (!swatch) {
		throw new Error("Could not extract dominant color from image");
	}

	const [r, g, b] = swatch.rgb;
	return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
}

/**
 * Extract multiple colors from an image (Luma-style)
 *
 * Returns up to 4 dominant colors that can be used for:
 * - Primary brand color (index 0)
 * - Secondary/gradient colors (index 1-3)
 *
 * @param imagePathOrUrl - Local path or URL to image
 * @returns Array of hex colors (e.g., ["#502aac", "#8f73cf", "#342064", "#e3ddf3"])
 */
export async function extractColorPaletteFromImage(
	imagePathOrUrl: string,
): Promise<string[]> {
	// Dynamic import to avoid bundling in client
	const { Vibrant } = await import("node-vibrant/node");

	const palette = await Vibrant.from(imagePathOrUrl).getPalette();

	const colors: string[] = [];

	// Extract in priority order
	const swatchOrder = [
		palette.Vibrant,
		palette.Muted,
		palette.LightVibrant,
		palette.DarkVibrant,
		palette.LightMuted,
		palette.DarkMuted,
	];

	for (const swatch of swatchOrder) {
		if (swatch) {
			const [r, g, b] = swatch.rgb;
			colors.push(rgbToHex(Math.round(r), Math.round(g), Math.round(b)));
		}
	}

	if (colors.length === 0) {
		throw new Error("Could not extract any colors from image");
	}

	// Return up to 4 colors (Luma pattern)
	return colors.slice(0, 4);
}

// Helper
function rgbToHex(r: number, g: number, b: number): string {
	const h = (x: number) => x.toString(16).padStart(2, "0");
	return `#${h(r)}${h(g)}${h(b)}`;
}
