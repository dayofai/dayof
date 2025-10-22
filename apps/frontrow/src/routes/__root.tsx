import type { QueryClient as QueryClientType } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { Devtools } from "@/components/devtools";
import Loader from "@/components/loader";
import { Toaster } from "@/components/ui/sonner";

export interface RouterAppContext {
	queryClient: QueryClientType;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "DayOf",
			},
		],
	}),

	component: RootDocument,
});

function RootDocument() {
	const isFetching = useRouterState({ select: (s) => s.isLoading });

	return (
		<html className="dark" lang="en">
			{/* biome-ignore lint: TanStack Start root requires head */}
			<head>
				<HeadContent />
			</head>
			<body>
				{isFetching ? <Loader /> : <Outlet />}
				<Toaster richColors />
				<Devtools />
				<Scripts />
			</body>
		</html>
	);
}
