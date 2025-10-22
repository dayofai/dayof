import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ContrastMatrix } from "@/components/dev/ContrastMatrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	generateEventThemeCSS,
	injectCss,
	makeOklchScale,
} from "@/lib/theme/theme.runtime";

export const Route = createFileRoute("/theme-demo")({
	component: ThemeDemo,
});

function ThemeDemo() {
	const scopeClass = ".theme-demo-scope";
	const [brand, setBrand] = useState("#6d00e6");
	const [dark, setDark] = useState(false);

	// Generate + inject theme CSS on mount and when brand changes
	useEffect(() => {
		const css = generateEventThemeCSS(scopeClass, brand, {
			includePerStepOpacityTriplets: false,
			includeTint: true,
			includeP3Overrides: false,
		});
		injectCss(css, "theme-demo-styles");
	}, [brand]);

	// Control dark mode on the html element
	useEffect(() => {
		if (dark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [dark]);

	// Build scale for contrast matrix
	const scale = useMemo(() => makeOklchScale(brand), [brand]);

	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<div
				className={`${scopeClass.replace(".", "")} container mx-auto p-6 space-y-8`}
			>
				{/* Header with controls */}
				<header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-semibold">Theme Demo</h1>
						<p className="text-sm text-muted-foreground">
							Interactive theme testing environment
						</p>
					</div>

					<div className="flex items-center gap-3 flex-wrap">
						<label className="text-sm font-medium">Brand</label>
						<input
							type="color"
							value={brand}
							onChange={(e) => setBrand(e.target.value)}
							className="h-9 w-12 rounded border border-border bg-transparent cursor-pointer"
							title={brand}
						/>
						<input
							type="text"
							value={brand}
							onChange={(e) => setBrand(e.target.value)}
							className="h-9 w-40 rounded border border-border px-2 font-mono text-sm bg-background"
						/>
						<button
							type="button"
							className="h-9 px-3 rounded border border-border bg-secondary text-secondary-foreground hover:bg-muted"
							onClick={() => setDark((d) => !d)}
						>
							{dark ? "☀️ Light" : "🌙 Dark"}
						</button>
					</div>
				</header>

				{/* Demo components */}
				<section className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Buttons */}
					<div className="space-y-4 p-4 rounded-xl border border-border bg-card">
						<h2 className="text-lg font-medium">ReUI Buttons</h2>
						<div className="flex flex-wrap gap-3">
							<Button variant="primary" size="md">
								Primary
							</Button>
							<Button variant="secondary" size="md">
								Secondary
							</Button>
							<Button variant="outline" size="md">
								Outline
							</Button>
							<Button variant="destructive" size="md">
								Destructive
							</Button>
							<Button variant="ghost" size="md">
								Ghost
							</Button>
						</div>
						<div className="flex flex-wrap gap-3">
							<Badge variant="primary" size="md">
								Badge
							</Badge>
							<Badge variant="success" size="md">
								Success
							</Badge>
							<Badge variant="warning" size="md">
								Warning
							</Badge>
							<Badge variant="destructive" size="sm">
								Destructive
							</Badge>
						</div>
					</div>

					{/* Brand Scale Buttons */}
					<div className="space-y-4 p-4 rounded-xl border border-border bg-card">
						<h2 className="text-lg font-medium">Brand Scale</h2>
						<div className="flex flex-wrap gap-3">
							<Button className="bg-brand-70 text-white hover:bg-brand-80">
								Brand-70
							</Button>
							<Button className="bg-brand-50 text-white hover:bg-brand-60">
								Brand-50
							</Button>
							<Button
								variant="outline"
								className="border-brand-40 hover:bg-brand-10"
							>
								Brand Outline
							</Button>
						</div>
					</div>
				</section>

				{/* Cards */}
				<section className="space-y-4">
					<h2 className="text-lg font-medium">ReUI Cards</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardContent className="p-6">
								<h3 className="text-base font-semibold mb-2">Default Card</h3>
								<p className="text-sm text-muted-foreground">
									Uses semantic tokens from theme system
								</p>
							</CardContent>
						</Card>

						<Card className="border-brand-30">
							<CardContent
								className="p-6"
								style={{
									background: "var(--brand-opacity-4)",
								}}
							>
								<h3 className="text-base font-semibold mb-2">Brand Card</h3>
								<p className="text-sm text-muted-foreground">
									Uses <code className="text-xs">--brand-opacity-4</code> and{" "}
									<code className="text-xs">--brand-30</code> border
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Typography */}
				<section className="space-y-4 p-4 rounded-xl border border-border bg-card">
					<h2 className="text-lg font-medium">Typography</h2>
					<div className="space-y-2">
						<p className="text-foreground">Primary text (foreground)</p>
						<p className="text-muted-foreground">
							Muted text (muted-foreground)
						</p>
						<p style={{ color: "var(--accent)" }}>
							Accent text (auto-contrast)
						</p>
					</div>
				</section>

				{/* Ticket Panel Demo */}
				<section className="space-y-3">
					<h2 className="text-lg font-medium">Ticket Panel Example</h2>
					<Card>
						<CardContent className="p-6">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Badge variant="primary" size="sm">
										Featured
									</Badge>
									<div className="text-sm text-muted-foreground">
										General Admission
									</div>
									<div className="text-2xl font-semibold">$29.00</div>
								</div>
								<div className="flex items-center gap-2">
									<Button variant="primary" size="lg" className="flex-1">
										Buy Tickets
									</Button>
									<Button variant="outline" size="lg">
										Details
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
					<p className="text-xs text-muted-foreground">
						Example using ReUI components with theme integration
					</p>
				</section>

				{/* Contrast matrix */}
				<section className="space-y-4">
					<div>
						<h2 className="text-lg font-medium">Contrast Matrix (AA/AAA)</h2>
						<p className="text-sm text-muted-foreground">
							Evaluates brand steps both as text and as backgrounds against
							light/dark text.
						</p>
					</div>
					<ContrastMatrix oklchByStep={scale.oklchSRGB} />
				</section>

				{/* Debug info */}
				<section className="p-4 rounded-xl border border-border bg-muted/50">
					<details>
						<summary className="cursor-pointer text-sm font-medium mb-2">
							Debug Info
						</summary>
						<div className="space-y-1 text-xs font-mono">
							<div>Brand Color: {brand}</div>
							<div>Theme Mode: {dark ? "Dark" : "Light"}</div>
							<div>Scope Class: {scopeClass}</div>
							<div>P3 Overrides: Disabled</div>
							<div>Opacity Triplets: Disabled</div>
							<div>Tint Support: Enabled</div>
						</div>
					</details>
				</section>
			</div>
		</div>
	);
}
