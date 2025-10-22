import { isZero } from "dinero.js";
import { useAtomValue, useSetAtom } from "jotai";
import { cartAtom, cartSummaryAtom } from "@/lib/atoms/cart";
import { onCheckoutCallbackAtom } from "@/lib/atoms/cart-callbacks";
import {
	pricingAtom,
	pricingErrorAtom,
	pricingLoadingAtom,
	retryPricingAtom,
} from "@/lib/atoms/pricing";
import {
	checkoutDisabledAtom,
	eventConfigAtom,
} from "@/lib/atoms/ticket-ui-states";
import { cn } from "@/lib/utils";
import { formatMoney, pluralizeTickets } from "@/lib/utils/format";

// NO PROPS - everything from atoms!
export function CartFooter() {
	// Read from atoms directly - no prop drilling!
	const cart = useAtomValue(cartAtom);
	const cartSummary = useAtomValue(cartSummaryAtom);
	const pricing = useAtomValue(pricingAtom);
	const isPricingLoading = useAtomValue(pricingLoadingAtom);
	const error = useAtomValue(pricingErrorAtom);
	const isCheckoutDisabled = useAtomValue(checkoutDisabledAtom);
	const eventConfig = useAtomValue(eventConfigAtom);
	const retryPricing = useSetAtom(retryPricingAtom);
	const onCheckoutCallback = useAtomValue(onCheckoutCallbackAtom);

	const hasItems = cartSummary.hasItems;
	const currency = eventConfig?.currency ?? "USD";
	const ctaLabel = eventConfig?.ui?.ctaLabel;
	const ctaVariant = eventConfig?.ui?.ctaVariant ?? "neutral";
	const footnote = eventConfig?.ui?.footnote;

	const renderError = () => {
		if (!(hasItems && error)) {
			return null;
		}
		return (
			<div className="space-y-3">
				<div className="text-destructive text-sm">
					We're having trouble calculating totals. Try again in a bit.
				</div>
				<button
					className="h-11 w-full rounded-lg bg-secondary font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
					onClick={() => retryPricing()}
					type="button"
				>
					Retry
				</button>
			</div>
		);
	};

	const renderPricing = () => {
		if (!(hasItems && pricing)) {
			return null;
		}
		const showBreakdown = eventConfig?.ui?.showPricingBreakdown !== false;
		return (
			<div className="space-y-3">
				{showBreakdown && (
					<div
						aria-atomic="true"
						aria-live="polite"
						className="space-y-2 text-sm"
					>
						{/* Subtotal */}
						<div className="flex items-center justify-between">
							<span className="text-sm text-[var(--dayof-muted)]">
								Subtotal ({cartSummary.totalQty}{" "}
								{pluralizeTickets(cartSummary.totalQty)})
							</span>
							<span className="font-medium tabular-nums text-[var(--dayof-dark)]">
								{formatMoney(pricing.subtotal, currency)}
							</span>
						</div>

						{/* Service fees */}
						{!isZero(pricing.fees) && (
							<div className="flex items-center justify-between text-xs">
								<span className="text-[var(--dayof-muted)]">Service fees</span>
								<span className="font-medium tabular-nums text-[var(--dayof-muted)]">
									+{formatMoney(pricing.fees, currency)}
								</span>
							</div>
						)}

						{/* Tax */}
						{!isZero(pricing.tax) && (
							<div className="flex items-center justify-between text-xs">
								<span className="text-[var(--dayof-muted)]">Tax</span>
								<span className="font-medium tabular-nums text-[var(--dayof-muted)]">
									+{formatMoney(pricing.tax, currency)}
								</span>
							</div>
						)}

						{/* Separator */}
						<div className="my-2 border-t border-[var(--theme-accent-08)]" />

						{/* Total */}
						<div className="flex items-center justify-between">
							<span className="font-semibold text-base text-[var(--dayof-muted)]">
								Total
							</span>
							<span className="font-semibold text-lg tabular-nums text-[var(--dayof-dark)]">
								{formatMoney(pricing.total, currency)}
							</span>
						</div>
					</div>
				)}

				{/* CTA Button (exact Luma) */}
				<button
					type="button"
					disabled={isPricingLoading || !hasItems || isCheckoutDisabled}
					className={cn(
						"w-full rounded-lg h-[38px] px-3.5",
						"font-semibold text-base text-white",
						ctaVariant === "neutral"
							? "bg-[rgb(105,115,125)] hover:bg-[rgb(95,105,115)]"
							: "bg-[var(--theme-cta)] hover:bg-[var(--theme-cta-hover)]",
						"disabled:opacity-50 disabled:cursor-not-allowed",
						"transition-colors duration-200",
					)}
					onClick={() => onCheckoutCallback?.(cart, pricing)}
				>
					{isPricingLoading
						? "Calculating..."
						: ctaLabel || `Get ${pluralizeTickets(cartSummary.totalQty)}`}
				</button>

				{footnote ? (
					<div className="pt-2 flex items-center justify-center gap-2 text-[13px] text-[var(--dayof-muted)]">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							className="h-3.5 w-3.5"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M8 1.75a.75.75 0 0 1 .75.75v3H12A.75.75 0 0 1 12 7H8.75v3a.75.75 0 0 1-1.5 0V7H4a.75.75 0 0 1 0-1.5h3.25v-3A.75.75 0 0 1 8 1.75M3.25 14a.75.75 0 0 1 .75-.75h8a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1-.75-.75"
							/>
						</svg>
						{footnote}
					</div>
				) : null}
			</div>
		);
	};

	const renderLoading = () => {
		if (!(hasItems && isPricingLoading)) {
			return null;
		}
		return (
			<button
				className="h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground"
				disabled
				type="button"
			>
				Calculating...
			</button>
		);
	};

	const renderEmpty = () => {
		if (hasItems) {
			return null;
		}
		return (
			<button
				className="h-11 w-full cursor-not-allowed rounded-lg bg-secondary font-medium text-secondary-foreground opacity-50"
				disabled
				type="button"
			>
				Select tickets to continue
			</button>
		);
	};

	return (
		<div className="w-full bg-white px-4 pt-3 pb-4">
			{renderError()}
			{renderPricing()}
			{renderLoading()}
			{renderEmpty()}
		</div>
	);
}
