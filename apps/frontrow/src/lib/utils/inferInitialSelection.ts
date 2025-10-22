import type { Ticket } from "@/lib/schemas/tickets";

export interface InferredItems {
	items: Array<{ ticketId: string; qty: number }>;
}

export function inferInitialSelection({
	tickets,
	searchParams,
	defaults,
}: {
	tickets: Ticket[];
	searchParams: URLSearchParams;
	defaults?: { defaultTicketId?: string; defaultQty?: number };
}): InferredItems | undefined {
	// 1) explicit defaults from event config
	if (defaults?.defaultTicketId) {
		const qty = Math.max(1, defaults.defaultQty ?? 1);
		return { items: [{ ticketId: defaults.defaultTicketId, qty }] };
	}

	// 2) preselection via query params (?ticket=ID&qty=2)
	const qpTicket = searchParams.get("ticket");
	if (qpTicket) {
		const qty = Math.max(1, Number(searchParams.get("qty") ?? "1"));
		return {
			items: [{ ticketId: qpTicket, qty: Number.isFinite(qty) ? qty : 1 }],
		};
	}

	// 3) only one purchasable ticket
	const purchasable = tickets.filter((t) => t.status === "available");
	if (purchasable.length === 1) {
		const t = purchasable[0];
		const min = t.limits?.minPerOrder ?? 1;
		return { items: [{ ticketId: t.id, qty: Math.max(1, min) }] };
	}

	// otherwise, no inference
	return undefined;
}
