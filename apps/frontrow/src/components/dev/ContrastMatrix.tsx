import Color from "colorjs.io";

type Step = 5 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
const STEPS: Step[] = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export interface ContrastMatrixProps {
	/** Map of step -> OKLCH string (sRGB-safe) */
	oklchByStep: Record<Step, string>;
}

/**
 * WCAG 2.1 contrast ratio using sRGB
 */
function contrast(a: string, b: string): number {
	const A = new Color(a).to("srgb");
	const B = new Color(b).to("srgb");
	return A.contrast(B, "WCAG21");
}

const GRAY_LIGHT = "oklch(0.985 0 0)"; // gray-5
const GRAY_DARK = "oklch(0.150 0 0)"; // gray-100
const WHITE = "#ffffff";
const BLACK = "#131517";

/**
 * Render WCAG compliance badge
 */
function badge(ratio: number) {
	const rounded = ratio.toFixed(2);

	if (ratio >= 7) {
		return (
			<span className="px-1.5 py-0.5 text-xs rounded bg-green-600 text-white">
				AAA {rounded}
			</span>
		);
	}

	if (ratio >= 4.5) {
		return (
			<span className="px-1.5 py-0.5 text-xs rounded bg-emerald-600 text-white">
				AA {rounded}
			</span>
		);
	}

	if (ratio >= 3.0) {
		return (
			<span className="px-1.5 py-0.5 text-xs rounded bg-amber-500 text-black">
				AA* {rounded}
			</span>
		);
	}

	return (
		<span className="px-1.5 py-0.5 text-xs rounded bg-rose-600 text-white">
			Fail {rounded}
		</span>
	);
}

/**
 * Contrast Matrix Component
 *
 * Displays WCAG 2.1 contrast ratios for all brand scale steps in multiple contexts:
 * - As text on light/dark backgrounds
 * - As background with light/dark text
 *
 * Helps validate that auto-contrast semantic tokens are working correctly.
 */
export function ContrastMatrix({ oklchByStep }: ContrastMatrixProps) {
	return (
		<div className="overflow-auto border border-border rounded-lg">
			<table className="min-w-[720px] w-full text-sm">
				<thead className="bg-muted/50">
					<tr className="text-left">
						<th className="p-2 font-medium">Step</th>
						<th className="p-2 font-medium">Swatch</th>
						<th className="p-2 font-medium">Text on Light</th>
						<th className="p-2 font-medium">Text on Dark</th>
						<th className="p-2 font-medium">BG + Light Text</th>
						<th className="p-2 font-medium">BG + Dark Text</th>
					</tr>
				</thead>
				<tbody>
					{STEPS.map((step) => {
						const sw = oklchByStep[step];
						const textOnLight = contrast(sw, GRAY_LIGHT);
						const textOnDark = contrast(sw, GRAY_DARK);
						const bgWithLight = contrast(WHITE, sw);
						const bgWithDark = contrast(BLACK, sw);

						return (
							<tr
								key={step}
								className="border-t border-border hover:bg-muted/30"
							>
								<td className="p-2 font-mono font-medium">{step}</td>
								<td className="p-2">
									<div
										className="h-6 w-24 rounded border border-border"
										style={{ background: sw }}
										title={sw}
									/>
								</td>
								<td className="p-2">{badge(textOnLight)}</td>
								<td className="p-2">{badge(textOnDark)}</td>
								<td className="p-2">{badge(bgWithLight)}</td>
								<td className="p-2">{badge(bgWithDark)}</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			{/* Legend */}
			<div className="p-3 bg-muted/30 border-t border-border text-xs text-muted-foreground">
				<strong>Legend:</strong> AAA ≥7:1, AA ≥4.5:1, AA* ≥3:1 (large text),
				Fail &lt;3:1
			</div>
		</div>
	);
}
