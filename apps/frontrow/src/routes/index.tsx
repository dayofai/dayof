import { createFileRoute, Link } from "@tanstack/react-router";
import { getHealth } from "../server/health";

export const Route = createFileRoute("/")({
	loader: async () => getHealth(),
	component: HomeComponent,
});

const TITLE_TEXT = `
 ██████╗  █████╗ ██╗   ██╗ ██████╗ ███████╗
 ██╔══██╗██╔══██╗╚██╗ ██╔╝██╔═══██╗██╔════╝
 ██║  ██║███████║ ╚████╔╝ ██║   ██║█████╗  
 ██║  ██║██╔══██║  ╚██╔╝  ██║   ██║██╔══╝  
 ██████╔╝██║  ██║   ██║   ╚██████╔╝██║     
 ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝     
`;

function HomeComponent() {
	const isHealthy = Route.useLoaderData();
	const statusText = isHealthy ? "Connected" : "Disconnected";

	return (
		<div className="container mx-auto max-w-3xl px-4 py-2">
			<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
			<div className="grid gap-6">
				<section className="rounded-lg border p-4">
					<h2 className="mb-2 font-medium">API Status</h2>
					<div className="flex items-center gap-2">
						<div
							className={`h-2 w-2 rounded-full ${isHealthy ? "bg-green-500" : "bg-red-500"}`}
						/>
						<span className="text-muted-foreground text-sm">{statusText}</span>
					</div>
				</section>
				<Link
					to="/dashboard"
					className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-black hover:bg-white/90"
				>
					Go to Dashboard
				</Link>
			</div>
		</div>
	);
}
