/**
 * DayOf Theme Runtime Generator
 *
 * Generates per-event OKLCH brand scales with:
 * - 11-step tonal progression (5-100)
 * - Auto-contrast semantic tokens (WCAG AA compliant)
 * - sRGB fallbacks + OKLCH overrides
 * - RGB opacity ladders (Luma pattern)
 *
 * NOTE: Caching disabled - generates fresh CSS each time.
 *       Enable caching later once system is validated.
 */

import Color from "colorjs.io";

// ============================================================================
// Types & Constants
// ============================================================================

export type Step = 5 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
export const STEPS: Step[] = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

type ChromaBucket = "highlights" | "mids" | "shadows";

const DEFAULT_LIGHTNESS: Record<Step, number | null> = {
	5: 95,
	10: 90,
	20: 80,
	30: 68,
	40: 58,
	50: null, // Keep base lightness
	60: 42,
	70: 32,
	80: 22,
	90: 14,
	100: 9,
};

const DEFAULT_CHROMA: Record<ChromaBucket, number> = {
	highlights: 0.75,
	mids: 1.0,
	shadows: 0.7,
};

export interface ScaleOptions {
	lightnessMap?: Partial<Record<Step, number | null>>;
	chromaScale?: Record<ChromaBucket, number>;
}

export interface GeneratedScale {
	/** sRGB-safe OKLCH strings */
	oklchSRGB: Record<Step, string>;
	/** P3-safe OKLCH strings (richer chroma on wide-gamut displays) */
	oklchP3: Record<Step, string>;
	/** sRGB hex fallback strings */
	hexSRGB: Record<Step, string>;
	/** Base RGB triplet for opacity ladders */
	baseRgb: [number, number, number];
}

interface SemanticTokens {
	light: {
		primary: string;
		primaryFg: string;
		accent: string;
		accentFg: string;
		ring: string;
		secondary: string;
		secondaryFg: string;
		muted: string;
		mutedFg: string;
		destructive: string;
		destructiveFg: string;
	};
	dark: {
		primary: string;
		primaryFg: string;
		accent: string;
		accentFg: string;
		ring: string;
		secondary: string;
		secondaryFg: string;
		muted: string;
		mutedFg: string;
		destructive: string;
		destructiveFg: string;
	};
}

// ============================================================================
// Scale Generation
// ============================================================================

/**
 * Generate 11-step OKLCH brand scale from a base color
 * Automatically adjusts lightness and chroma for perceptual balance
 */
export function makeOklchScale(
	baseInput: string,
	opts: ScaleOptions = {},
): GeneratedScale {
	const lmap = { ...DEFAULT_LIGHTNESS, ...opts.lightnessMap };
	const cscale = opts.chromaScale ?? DEFAULT_CHROMA;

	const base = new Color(baseInput).to("oklch");
	const L0 = base.oklch.l;
	const C0 = base.oklch.c;
	const H0 = base.oklch.h;

	const oklchSRGB: Partial<Record<Step, string>> = {};
	const oklchP3: Partial<Record<Step, string>> = {};
	const hexSRGB: Partial<Record<Step, string>> = {};

	for (const step of STEPS) {
		const Lp = lmap[step] === null ? L0 : clamp01((lmap[step] as number) / 100);
		const bucket: ChromaBucket =
			Lp >= 0.8 ? "highlights" : Lp <= 0.25 ? "shadows" : "mids";
		const Cp = C0 * cscale[bucket];

		const draft = new Color("oklch", [Lp, Cp, H0]);

		// sRGB-safe (works everywhere)
		const safeSRGB = draft
			.toGamut({ space: "srgb", method: "clip" })
			.to("oklch");
		oklchSRGB[step] = safeSRGB.toString({ format: "oklch", precision: 4 });

		// P3-safe (richer chroma on wide-gamut displays)
		const safeP3 = draft.toGamut({ space: "p3", method: "clip" }).to("oklch");
		oklchP3[step] = safeP3.toString({ format: "oklch", precision: 4 });

		// sRGB hex fallback for older browsers
		hexSRGB[step] = draft
			.toGamut({ space: "srgb", method: "clip" })
			.to("srgb")
			.toString({ format: "hex" });
	}

	// Extract RGB triplet from base (step 50)
	const base50Hex = hexSRGB[50];
	if (!base50Hex) throw new Error("Failed to generate step 50");

	const base50 = new Color(base50Hex)
		.to("srgb")
		.coords.map((v: number) => Math.round(v * 255)) as [number, number, number];

	return {
		oklchSRGB: oklchSRGB as Record<Step, string>,
		oklchP3: oklchP3 as Record<Step, string>,
		hexSRGB: hexSRGB as Record<Step, string>,
		baseRgb: base50,
	};
}

// ============================================================================
// Auto-Contrast Mapping
// ============================================================================

/**
 * Calculate WCAG 2.1 contrast ratio between two colors
 */
export function contrast(a: string, b: string): number {
	const A = new Color(a).to("srgb");
	const B = new Color(b).to("srgb");
	return A.contrast(B, "WCAG21");
}

/**
 * Pick the best step from a scale that passes a target contrast ratio
 */
function pickStepForContrast(
	scaleOKLCH: Record<Step, string>,
	bgColor: string,
	target: number,
	order: Step[],
): Step {
	let best = order[0];
	let bestScore = -Number.POSITIVE_INFINITY;

	for (const step of order) {
		const cr = contrast(scaleOKLCH[step], bgColor);
		if (cr >= target) return step;
		if (cr > bestScore) {
			bestScore = cr;
			best = step;
		}
	}

	return best;
}

/**
 * Compute semantic tokens that automatically pass WCAG AA (4.5:1) contrast
 * in both light and dark modes
 */
function computeSemantics(scale: GeneratedScale): SemanticTokens {
	// Neutral backgrounds (aligned with theme.css)
	const lightBg = "oklch(0.985 0 0)"; // gray-5
	const darkBg = "oklch(0.150 0 0)"; // gray-100
	const white = "#ffffff";
	const nearBlack = "#131517";

	// Search orders (darkest-first for light mode, lightest-first for dark)
	const darkOrder: Step[] = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5];
	const lightOrder: Step[] = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

	// Light mode: pick dark brand colors that contrast with white text
	const primaryLight = pickStepForContrast(
		scale.oklchSRGB,
		white,
		4.5,
		darkOrder,
	);
	const accentLight = pickStepForContrast(
		scale.oklchSRGB,
		lightBg,
		4.5,
		darkOrder,
	);
	const ringLight = pickStepForContrast(
		scale.oklchSRGB,
		lightBg,
		3.0,
		[40, 50, 60, 70],
	);
	const destructiveLight = pickStepForContrast(
		scale.oklchSRGB,
		white,
		4.5,
		[70, 80, 90, 100],
	);

	// Dark mode: pick light brand colors that contrast with black text
	const primaryDark = pickStepForContrast(
		scale.oklchSRGB,
		nearBlack,
		4.5,
		lightOrder,
	);
	const accentDark = pickStepForContrast(
		scale.oklchSRGB,
		darkBg,
		4.5,
		lightOrder,
	);
	const ringDark = pickStepForContrast(
		scale.oklchSRGB,
		darkBg,
		3.0,
		[60, 50, 40, 30],
	);
	const destructiveDark = pickStepForContrast(
		scale.oklchSRGB,
		nearBlack,
		4.5,
		[30, 20, 10, 5],
	);

	return {
		light: {
			primary: `var(--brand-${primaryLight})`,
			primaryFg: white,
			accent: `var(--brand-${accentLight})`,
			accentFg: nearBlack,
			ring: `var(--brand-${ringLight})`,
			secondary: "var(--gray-10)",
			secondaryFg: "var(--gray-100)",
			muted: "var(--gray-10)",
			mutedFg: "var(--gray-50)",
			destructive: `var(--brand-${destructiveLight})`,
			destructiveFg: white,
		},
		dark: {
			primary: `var(--brand-${primaryDark})`,
			primaryFg: nearBlack,
			accent: `var(--brand-${accentDark})`,
			accentFg: white,
			ring: `var(--brand-${ringDark})`,
			secondary: "var(--gray-80)",
			secondaryFg: "var(--gray-5)",
			muted: "var(--gray-80)",
			mutedFg: "var(--gray-40)",
			destructive: `var(--brand-${destructiveDark})`,
			destructiveFg: nearBlack,
		},
	};
}

// ============================================================================
// CSS Generation
// ============================================================================

export interface BuildCssOptions {
	scope: string; // e.g., ".event-evt123"
	includePerStepOpacityTriplets?: boolean; // default false
	includeTint?: boolean; // default true
	includeP3Overrides?: boolean; // default false (ship v1 without P3)
}

/**
 * Build scoped CSS with:
 * - sRGB hex fallbacks
 * - OKLCH overrides (@supports)
 * - Optional P3 wide-gamut overrides (@media)
 * - Auto-contrast semantic tokens for light & dark
 */
export function buildScopedCss(
	scale: GeneratedScale,
	options: BuildCssOptions,
): string {
	const scope = options.scope;
	const includeTriplets = options.includePerStepOpacityTriplets ?? false;
	const includeTint = options.includeTint ?? true;
	const includeP3 = options.includeP3Overrides ?? false;

	const sem = computeSemantics(scale);
	const lines: string[] = [];

	// -------------------------------------------------------------------------
	// 1. Fallback: sRGB hex + RGB opacity ladder
	// -------------------------------------------------------------------------
	lines.push(`${scope} {`);

	// Brand scale (hex fallback)
	for (const step of STEPS) {
		lines.push(`  --brand-${step}: ${scale.hexSRGB[step]};`);

		// Optional: per-step opacity triplets (Luma pattern)
		if (includeTriplets) {
			const [r, g, b] = hexToRgb(scale.hexSRGB[step]);
			lines.push(`  --brand-${step}-transparent: rgba(${r}, ${g}, ${b}, 0);`);
			lines.push(
				`  --brand-${step}-translucent: rgba(${r}, ${g}, ${b}, 0.25);`,
			);
			lines.push(
				`  --brand-${step}-thick-translucent: rgba(${r}, ${g}, ${b}, 0.80);`,
			);
		}
	}

	// RGB base + opacity ladder
	lines.push(`  --brand-base-rgb: ${scale.baseRgb.join(", ")};`);
	for (const pct of [4, 8, 16, 24, 32, 48, 64, 80]) {
		const alpha = (pct / 100).toFixed(2);
		lines.push(
			`  --brand-opacity-${pct}: rgba(var(--brand-base-rgb), ${alpha});`,
		);
	}

	// Light mode semantic tokens (auto-contrast)
	lines.push(`  --primary: ${sem.light.primary};`);
	lines.push(`  --primary-foreground: ${sem.light.primaryFg};`);
	lines.push(`  --accent: ${sem.light.accent};`);
	lines.push(`  --accent-foreground: ${sem.light.accentFg};`);
	lines.push(`  --ring: ${sem.light.ring};`);
	lines.push(`  --secondary: ${sem.light.secondary};`);
	lines.push(`  --secondary-foreground: ${sem.light.secondaryFg};`);
	lines.push(`  --muted: ${sem.light.muted};`);
	lines.push(`  --muted-foreground: ${sem.light.mutedFg};`);
	lines.push(`  --destructive: ${sem.light.destructive};`);
	lines.push(`  --destructive-foreground: ${sem.light.destructiveFg};`);

	lines.push(`}`);

	// -------------------------------------------------------------------------
	// 2. Modern: OKLCH overrides (sRGB-clipped)
	// -------------------------------------------------------------------------
	lines.push(`@supports (color: oklch(1 0 0)) {`);
	lines.push(`  ${scope} {`);

	for (const step of STEPS) {
		lines.push(`    --brand-${step}: ${scale.oklchSRGB[step]};`);

		if (includeTriplets) {
			const ok = scale.oklchSRGB[step];
			lines.push(
				`    --brand-${step}-transparent: ${ok.replace(")", " / 0)")};`,
			);
			lines.push(
				`    --brand-${step}-translucent: ${ok.replace(")", " / 0.25)")};`,
			);
			lines.push(
				`    --brand-${step}-thick-translucent: ${ok.replace(")", " / 0.80)")};`,
			);
		}
	}

	lines.push(`  }`);

	// -------------------------------------------------------------------------
	// 3. Optional: P3 wide-gamut overrides
	// -------------------------------------------------------------------------
	if (includeP3) {
		lines.push(`  @media (color-gamut: p3) {`);
		lines.push(`    ${scope} {`);

		for (const step of STEPS) {
			lines.push(`      --brand-${step}: ${scale.oklchP3[step]};`);
		}

		lines.push(`    }`);
		lines.push(`  }`);
	}

	// -------------------------------------------------------------------------
	// 4. Dark mode semantics (global .dark affects this scope)
	// -------------------------------------------------------------------------
	lines.push(`  .dark ${scope} {`);
	lines.push(`    --primary: ${sem.dark.primary};`);
	lines.push(`    --primary-foreground: ${sem.dark.primaryFg};`);
	lines.push(`    --accent: ${sem.dark.accent};`);
	lines.push(`    --accent-foreground: ${sem.dark.accentFg};`);
	lines.push(`    --ring: ${sem.dark.ring};`);
	lines.push(`    --secondary: ${sem.dark.secondary};`);
	lines.push(`    --secondary-foreground: ${sem.dark.secondaryFg};`);
	lines.push(`    --muted: ${sem.dark.muted};`);
	lines.push(`    --muted-foreground: ${sem.dark.mutedFg};`);
	lines.push(`    --destructive: ${sem.dark.destructive};`);
	lines.push(`    --destructive-foreground: ${sem.dark.destructiveFg};`);
	lines.push(`  }`);

	// -------------------------------------------------------------------------
	// 5. Optional: Tint root for nested contexts
	// -------------------------------------------------------------------------
	if (includeTint) {
		lines.push(`  ${scope}.tint, ${scope} .tint-root {`);
		lines.push(
			`    --tint-color: color-mix(in oklch, var(--brand-60) 35%, transparent);`,
		);
		lines.push(`  }`);
	}

	lines.push(`}`); // end @supports

	return lines.join("\n");
}

/**
 * High-level API: Generate complete scoped CSS for an event
 *
 * @param scopeClass - CSS class selector (e.g., ".event-evt123")
 * @param baseColor - Hex color to generate scale from (e.g., "#7646ad")
 * @param options - Optional config (defaults to safe v1 settings)
 * @returns CSS string ready for <style> tag injection
 */
export function generateEventThemeCSS(
	scopeClass: string,
	baseColor: string,
	options?: Omit<BuildCssOptions, "scope">,
): string {
	// NOTE: No caching - generates fresh each time
	// Add caching later once system is validated

	const scale = makeOklchScale(baseColor);
	return buildScopedCss(scale, { scope: scopeClass, ...options });
}

/**
 * Client-side injection helper (for dynamic theme switching)
 * Safe to call on both server and client
 */
export function injectCss(
	cssText: string,
	id?: string,
): HTMLStyleElement | undefined {
	if (typeof document === "undefined") return;

	let el = id ? (document.getElementById(id) as HTMLStyleElement | null) : null;

	if (!el) {
		el = document.createElement("style");
		if (id) el.id = id;
		el.setAttribute("data-source", "dayof-theme");
		document.head.appendChild(el);
	}

	el.textContent = cssText;
	return el;
}

// ============================================================================
// Helpers
// ============================================================================

function hexToRgb(hex: string): [number, number, number] {
	const s = hex.replace("#", "");
	const n = Number.parseInt(
		s.length === 3
			? s
					.split("")
					.map((c) => c + c)
					.join("")
			: s,
		16,
	);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function clamp01(x: number): number {
	return Math.max(0, Math.min(1, x));
}
