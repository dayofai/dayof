import { createFileRoute } from "@tanstack/react-router";
import EventPage from "@/features/event";
import { pricingQuery } from "@/lib/queries/pricing";
import { ticketsQuery } from "@/lib/queries/tickets";
import { inferInitialSelection } from "@/lib/utils/inferInitialSelection";

export const Route = createFileRoute("/event/$eventName")({
	loader: async ({ context, params, location }) => {
		const eventId = params.eventName;
		// 1) ensure tickets are ready for SSR/hydration
		await context.queryClient.ensureQueryData(ticketsQuery(eventId));

		// 2) optional pricing prefetch based on inference (no cart persistence)
		try {
			const tickets =
				context.queryClient.getQueryData<any[]>(["tickets", eventId]) ?? [];
			const inferred = inferInitialSelection({
				tickets,
				searchParams: new URLSearchParams(location.searchStr),
			});
			if (inferred && inferred.items.length > 0) {
				// choose blocking here for immediate totals; switch to fetchQuery to stream
				await context.queryClient.ensureQueryData(
					pricingQuery({ eventId, items: inferred.items }),
				);
			}
		} catch (_e) {
			// ignore inference errors
		}
	},
	component: EventComponent,
});

function EventComponent() {
	const { eventName } = Route.useParams();

	return <EventPage eventName={eventName} />;
}
