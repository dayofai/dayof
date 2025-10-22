export function FeaturedBadge({ label = "Best Value" }: { label?: string }) {
	return (
		<div className="pointer-events-none absolute -top-2 -right-2 z-10">
			<div
				className="absolute inset-0 blur-md opacity-60"
				style={{ background: "var(--theme-cta)" }}
				aria-hidden="true"
			/>
			<div className="relative select-none rounded-full bg-[var(--theme-cta)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
				{label}
			</div>
		</div>
	);
}
