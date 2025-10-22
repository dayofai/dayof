import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$orgHandle/$eventHandle")({
	// Server-side data fetch, client-side render
	ssr: "data-only",

	loader: async ({ params }) => {
		const { orgHandle, eventHandle } = params;

		// TODO: Fetch actual event data from database
		return {
			orgHandle,
			eventHandle,
		};
	},

	component: EventComponent,
});

function EventComponent() {
	const { orgHandle, eventHandle } = Route.useLoaderData();

	return (
		<div className="container mx-auto min-h-screen px-4 py-10">
			<div className="mb-10">
				<h1 className="text-6xl font-normal leading-tight antialiased break-words text-foreground">
					{eventHandle.replace(/-/g, " ")}
				</h1>
				<p className="mt-4 text-2xl font-normal leading-tight tracking-wide antialiased text-muted-foreground">
					Event page for @{orgHandle}
				</p>
			</div>

			<div className="rounded-xl border border-border bg-card p-8">
				<p className="text-sm text-muted-foreground">
					Empty event page. Build components here when ready.
				</p>
			</div>
		</div>
	);
}
