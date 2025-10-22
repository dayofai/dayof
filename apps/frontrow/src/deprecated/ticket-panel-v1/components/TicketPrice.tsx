export interface TicketPriceProps {
	pricing: {
		ticket: { amount: number; currency: string };
		strikePrice?: { amount: number; currency: string };
		fees?: {
			amount: { amount: number; currency: string };
			included: boolean;
			showBreakdown?: boolean;
			label?: string;
		};
		tax?: {
			amount: { amount: number; currency: string };
			included: boolean;
			showBreakdown?: boolean;
			label?: string;
		};
	};
	currency?: string;
	locale?: string;
}

/**
 * Returns formatted ticket price as a string
 *
 * Uses Intl.NumberFormat directly (simple, fast, no dependencies)
 */
export function TicketPrice({
	pricing,
	currency,
	locale,
}: TicketPriceProps): string {
	const cents = pricing.ticket.amount;
	const finalCurrency = currency ?? pricing.ticket.currency;
	const finalLocale =
		locale ??
		(typeof navigator !== "undefined" && navigator.language
			? navigator.language
			: "en-US");

	return new Intl.NumberFormat(finalLocale, {
		style: "currency",
		currency: finalCurrency,
	}).format(cents / 100);
}

/**
 * Helper: Extract fee/tax amounts for tooltip display
 * Returns raw objects (already have amount in cents)
 */
export function calculateBreakdownAmounts(
	pricing: TicketPriceProps["pricing"],
) {
	return {
		feesAmount: pricing.fees?.amount ?? null,
		taxAmount: pricing.tax?.amount ?? null,
	};
}
