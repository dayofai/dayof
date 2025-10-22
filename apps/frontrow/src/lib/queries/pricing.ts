import { queryOptions } from "@tanstack/react-query";
import { calculateCartTotal } from "@/lib/mock-data";

export interface PricingItem {
	ticketId: string;
	qty: number;
}

export const pricingQuery = ({
	eventId,
	items,
}: {
	eventId: string;
	items: PricingItem[];
}) =>
	queryOptions({
		queryKey: [
			"cart-pricing",
			eventId,
			...items
				.map((i) => `${i.ticketId}:${i.qty}`)
				.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
		],
		queryFn: () =>
			calculateCartTotal({
				eventId,
				items,
			}),
		enabled: items.length > 0,
		staleTime: 0,
	});
