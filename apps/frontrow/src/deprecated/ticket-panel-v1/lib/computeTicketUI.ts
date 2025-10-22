import type { Ticket } from "@/lib/schemas/tickets";
import { formatUnavailableDate } from "@/lib/utils/format";

export interface TicketUIState {
	ticketId: string;
	ticket: Ticket;
	currentQty: number;
	isPurchasable: boolean;
	isLocked: boolean;
	canIncrement: boolean;
	canDecrement: boolean;
	showTrashIcon: boolean;
	isGreyedOut: boolean;
	isSelected: boolean;
	unavailableReason: string | null;
	helperText: string | null;
}

interface TicketRow {
	ticket: Ticket;
	qty: number;
}

interface EventConfig {
	mixedTicketTypesAllowed: boolean;
	timeZone: string;
}

interface CartState {
	hasItems: boolean;
}

/**
 * Pure function to compute UI state for tickets
 *
 * This is the extracted business logic from TanStack DB .fn.select()
 * Now testable as a pure function!
 */
export function computeTicketUI(
	rows: TicketRow[],
	event: EventConfig,
	cart: CartState,
	now: number = Date.now(),
): TicketUIState[] {
	return rows.map(({ ticket, qty }) => {
		// 1. Compute remaining capacity
		const remaining =
			typeof ticket.soldLimit === "number"
				? ticket.soldLimit - (ticket.soldCount ?? 0)
				: null;

		// 2. Check if purchasable (complex date logic)
		const validStatus =
			ticket.status === "on_sale" || ticket.status === "waitlist";
		const startsOk =
			!ticket.salesWindow?.startsAt ||
			new Date(ticket.salesWindow.startsAt).getTime() <= now;
		const endsOk =
			!ticket.salesWindow?.endsAt ||
			new Date(ticket.salesWindow.endsAt).getTime() >= now;
		const hasCapacity = remaining === null || remaining > 0;
		const isPurchasable = validStatus && startsOk && endsOk && hasCapacity;

		// 3. Locking logic (depends on event config and cart state)
		const inCart = qty > 0;
		const isLocked = !event.mixedTicketTypesAllowed && cart.hasItems && !inCart;

		// 4. Compute effective max (for increment validation)
		const maxOrder = ticket.limits?.maxPerOrder ?? 999;
		const maxPerson = ticket.limits?.maxPerPerson ?? 999;
		const capacityMax = remaining ?? 999;
		const effectiveMax = Math.min(maxOrder, maxPerson, capacityMax);

		// 5. Helper text (priority-based conditional logic)
		let helperText: string | null = null;
		if (ticket.limits?.maxPerOrder && qty >= ticket.limits.maxPerOrder) {
			helperText = `Max ${ticket.limits.maxPerOrder} per order`;
		} else if (remaining !== null && remaining > 0 && remaining <= 5) {
			helperText = `Only ${remaining} left!`;
		} else if (
			ticket.limits?.maxPerOrder &&
			qty > 0 &&
			qty >= ticket.limits.maxPerOrder - 2
		) {
			const slotsLeft = ticket.limits.maxPerOrder - qty;
			helperText = `${slotsLeft} more available`;
		} else if (remaining !== null && remaining > 0 && remaining <= 20) {
			helperText = "Limited availability";
		} else if (
			qty === 0 &&
			ticket.limits?.maxPerPerson &&
			ticket.limits.maxPerPerson <= 4
		) {
			helperText = `Max ${ticket.limits.maxPerPerson} per person`;
		} else if (
			qty > 0 &&
			ticket.limits?.minPerOrder &&
			qty < ticket.limits.minPerOrder
		) {
			helperText = `Min ${ticket.limits.minPerOrder} required`;
		}

		// 6. Unavailable reason (complex string formatting)
		let unavailableReason: string | null = null;
		if (isLocked) {
			unavailableReason = "Remove other tickets to add this one";
		} else if (!isPurchasable) {
			if (ticket.status === "sold_out" || !hasCapacity) {
				unavailableReason = "Sold out";
			} else if (
				ticket.status === "scheduled" &&
				ticket.salesWindow?.startsAt
			) {
				unavailableReason = `On sale ${formatUnavailableDate(
					ticket.salesWindow.startsAt,
					event.timeZone,
				)}`;
			} else if (ticket.status === "ended" || !endsOk) {
				unavailableReason = ticket.salesWindow?.endsAt
					? `Sale ended ${formatUnavailableDate(ticket.salesWindow.endsAt, event.timeZone)}`
					: "Sale ended";
			} else if (ticket.status === "invite_only") {
				unavailableReason = "Requires unlock code";
			} else if (ticket.status === "paused") {
				unavailableReason = "Temporarily unavailable";
			} else if (ticket.status === "external") {
				unavailableReason = "Available externally";
			}
		}

		// 7. Return UI state object
		return {
			ticketId: ticket.id,
			ticket,
			currentQty: qty,
			isPurchasable,
			isLocked,
			canIncrement: isPurchasable && !isLocked && qty < effectiveMax,
			canDecrement: qty > 0,
			showTrashIcon: qty === 1,
			isGreyedOut: !isPurchasable || isLocked,
			isSelected: qty > 0,
			unavailableReason,
			helperText,
		};
	});
}
