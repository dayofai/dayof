import { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { getDefaultStore } from 'jotai';
import { queryClientAtom } from 'jotai-tanstack-query';
import './index.css';
import type { RouterAppContext } from './routes/__root';
import { routeTree } from './routeTree.gen';

// Create QueryClient with sensible defaults
const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000, // 60 seconds
			},
		},
	});

// Client-side singleton for dev HMR (prevents router recreation on hot reload)
let clientRouterSingleton: ReturnType<typeof createRouterInstance> | undefined;

function createRouterInstance(ctx?: RouterAppContext) {
	const queryClient = ctx?.queryClient ?? createQueryClient();

	// Hydrate Jotai's default store with queryClient (client-side only)
	if (typeof window !== "undefined") {
		const store = getDefaultStore();
		store.set(queryClientAtom, queryClient);
	}

	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: ctx ?? { queryClient },
	});

	// Wire TanStack Router ↔ TanStack Query SSR integration
	setupRouterSsrQueryIntegration({ router, queryClient });
	return router;
}

export const getRouter = (ctx?: RouterAppContext) => {
	// On server (SSR): Always create fresh router with fresh QueryClient per request
	// On client in dev: Reuse singleton to prevent HMR issues
	// On client in prod: Create new router
	if (typeof window !== "undefined" && import.meta.env?.DEV) {
		if (!clientRouterSingleton) {
			clientRouterSingleton = createRouterInstance(ctx);
		}
		return clientRouterSingleton;
	}
	return createRouterInstance(ctx);
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
