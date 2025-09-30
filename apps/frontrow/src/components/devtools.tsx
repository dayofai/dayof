import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

export function Devtools() {
  // Only show devtools in development
  if (import.meta.env.PROD) {
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
        { name: 'Query', render: <ReactQueryDevtoolsPanel /> },
      ]}
    />
  );
}
