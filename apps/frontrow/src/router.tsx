import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import Loader from './components/loader';
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
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: ctx ?? { queryClient },
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => <div>Not Found</div>,
    Wrap: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
  return router;
}

export const getRouter = (ctx?: RouterAppContext) => {
  // On server (SSR): Always create fresh router with fresh QueryClient per request
  // On client in dev: Reuse singleton to prevent HMR issues
  // On client in prod: Create new router
  if (typeof window !== 'undefined' && import.meta.env?.DEV) {
    if (!clientRouterSingleton) {
      clientRouterSingleton = createRouterInstance(ctx);
    }
    return clientRouterSingleton;
  }
  return createRouterInstance(ctx);
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
