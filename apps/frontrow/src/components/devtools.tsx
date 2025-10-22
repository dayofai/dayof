import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

export function Devtools() {
  // Only show devtools in development
  if (import.meta.env.PROD) {
    return null;
  }

  // Get queryClient from router context
  const queryClient = useRouterState({
    select: (s) => s.matches[0]?.context.queryClient,
  });

  if (!queryClient) {
    return null;
  }

  return (
    <TanStackDevtools
      config={{
        position: 'bottom-right',
        hideUntilHover: false,
        defaultOpen: false,
      }}
      plugins={[
        { name: 'Router', render: <TanStackRouterDevtoolsPanel /> },
        {
          name: 'Query',
          render: (
            <QueryClientProvider client={queryClient}>
              <ReactQueryDevtoolsPanel />
            </QueryClientProvider>
          ),
        },
      ]}
    />
  );
}
