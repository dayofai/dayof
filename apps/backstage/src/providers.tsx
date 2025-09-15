import { AuthQueryProvider } from '@daveyplate/better-auth-tanstack';
import { AuthUIProviderTanstack } from '@daveyplate/better-auth-ui/tanstack';
import { QueryClientProvider } from '@tanstack/react-query';
import { Link as RouterLink, useRouter } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthQueryProvider>
        <AuthUIProviderTanstack
          authClient={authClient}
          Link={({
            href,
            ...rest
          }: { href: string } & Omit<
            React.ComponentProps<typeof RouterLink>,
            'to'
          >) => <RouterLink to={href} {...rest} />}
          navigate={(href: string) => router.navigate({ to: href })}
          replace={(href: string) =>
            router.navigate({ to: href, replace: true })
          }
        >
          {children}
        </AuthUIProviderTanstack>
      </AuthQueryProvider>
    </QueryClientProvider>
  );
}
