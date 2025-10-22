import { ClientOnly } from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { TicketUIState } from "@/features/ticket-panel/lib/computeTicketUI";
import { cartAtom } from "@/lib/atoms/cart";
import {
	onCartChangeCallbackAtom,
	onCheckoutCallbackAtom,
} from "@/lib/atoms/cart-callbacks";
import { pricingAtom } from "@/lib/atoms/pricing";
import { eventConfigAtom } from "@/lib/atoms/ticket-ui-states";
import type { calculateCartTotal } from "@/lib/mock-data";
import type { CartItem } from "@/lib/schemas/cart";
import type { Event } from "@/lib/schemas/event";
import { CartFooter } from "./CartFooter";
import { TicketList } from "./TicketList";

export type ServerPricing = Awaited<ReturnType<typeof calculateCartTotal>>;
export type { TicketUIState };

interface TicketsPanelProps {
	eventId: string;
	event: Pick<Event, "mixedTicketTypesAllowed" | "currency" | "timeZone"> & {
		locale?: string;
	};
	onCheckout: (
		cartItems: CartItem[],
		pricing: ServerPricing | undefined,
	) => void;
	onChange?: (cartItems: CartItem[]) => void;
	ui?: {
		showHeader?: boolean;
		ctaLabel?: string;
		ctaVariant?: "neutral" | "accented";
		footnote?: string;
	};
}

export function TicketsPanel(props: TicketsPanelProps) {
	return (
		<TooltipProvider>
			<ClientOnly fallback={<TicketsPanelSkeleton />}>
				<TicketsPanelClient {...props} />
			</ClientOnly>
		</TooltipProvider>
	);
}

// TODO: Improve design for skeleton
function TicketsPanelSkeleton() {
	return (
		<Card className="rounded-xl bg-white/32 shadow-[0_1px_4px_rgba(0,0,0,0.1)] border border-white/16 backdrop-blur-[16px] px-4 py-3">
			{/* Header skeleton */}
			<div className="-mx-4 -mt-3 mb-3 px-4 pt-2 pb-3 border-b border-white/16">
				<Skeleton className="h-5 w-24 bg-white/20" />
				<Skeleton className="mt-1 h-4 w-48 bg-white/10" />
			</div>

			{/* Tickets skeleton */}
			<div className="space-y-2">
				{[1, 2, 3].map((i) => (
					<Skeleton className="h-20 rounded-lg bg-white/10" key={i} />
				))}
			</div>

			{/* Footer skeleton */}
			<div className="-mx-4 -mb-3 mt-3 border-t border-white/16 bg-white/5 p-4">
				<Skeleton className="h-11 w-full rounded-lg bg-white/20" />
			</div>
		</Card>
	);
}

function TicketsPanelClient({
	// eventId,
	event,
	onCheckout,
	onChange,
	ui,
}: TicketsPanelProps) {
	// 1. Set event config (includes UI config - no drilling!)
	const setEventConfig = useSetAtom(eventConfigAtom);
	React.useEffect(() => {
		setEventConfig({
			mixedTicketTypesAllowed: event.mixedTicketTypesAllowed,
			timeZone: event.timeZone,
			currency: event.currency,
			locale: event.locale,
			ui,
		});
	}, [
		event.mixedTicketTypesAllowed,
		event.timeZone,
		event.currency,
		event.locale,
		ui,
		setEventConfig,
	]);

	// 2. Register callbacks (no drilling!)
	const setOnChangeCallback = useSetAtom(onCartChangeCallbackAtom);
	const setOnCheckoutCallback = useSetAtom(onCheckoutCallbackAtom);
	const cart = useAtomValue(cartAtom);
	const pricing = useAtomValue(pricingAtom);

	React.useEffect(() => {
		setOnChangeCallback(onChange ?? null);
	}, [onChange, setOnChangeCallback]);

	React.useEffect(() => {
		setOnCheckoutCallback(() => () => onCheckout(cart, pricing));
	}, [onCheckout, cart, pricing, setOnCheckoutCallback]);

	// 3. Render - ZERO PROPS drilled!
	const eventConfig = useAtomValue(eventConfigAtom);

	return (
		<Card className="rounded-xl bg-white/32 shadow-[0_1px_4px_rgba(0,0,0,0.1)] border border-white/16 backdrop-blur-[16px] overflow-hidden px-4 py-3">
			{eventConfig?.ui?.showHeader !== false && (
				<div className="px-4 pt-2 pb-3 bg-[var(--theme-accent-04)] border-b border-[var(--theme-accent-08)] rounded-t-[10px]">
					<h2 className="text-sm font-medium text-[var(--dayof-muted)]">
						Get Tickets
					</h2>
					<p className="text-base text-[var(--dayof-dark)] mt-1">
						Welcome! Please choose your desired ticket type:
					</p>
				</div>
			)}

			{/* ZERO PROPS - components read from atoms! */}
			<div className="px-4 pt-0 pb-3">
				<TicketList />
			</div>

			{/* ZERO PROPS - CartFooter reads from atoms! */}
			<CartFooter />
		</Card>
	);
}
