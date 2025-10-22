import { createFileRoute } from "@tanstack/react-router";
import { TicketsPanel } from "@/deprecated/ticket-panel-v1/components/TicketsPanel";
import { ticketsQuery } from "@/lib/queries/tickets";

export const Route = createFileRoute("/ticket-playground")({
	// Keep SSR off for the playground page, but still prefill cache for dev parity
	ssr: false,
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(ticketsQuery("evt_123")),
	component: Playground,
});

function Playground() {
	return (
		<div className="fixed inset-0 overflow-auto bg-[rgb(243,245,247)] p-8">
			<div className="mx-auto max-w-2xl">
				<TicketsPanel
					event={{
						mixedTicketTypesAllowed: true,
						currency: "USD",
						timeZone: "America/Los_Angeles",
					}}
					eventId="evt_123"
					onCheckout={() => {
						/* no-op */
					}}
					ui={{
						showHeader: true,
						ctaVariant: "neutral",
						footnote: "Suggested price shown. Name your own price at checkout.",
					}}
				/>
			</div>
		</div>
	);
}
