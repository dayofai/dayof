import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

export const getPrivateData = createServerFn({ method: 'GET' }).handler(() => {
  return { message: 'ok' } as const;
});

export const Route = createFileRoute('/dashboard')({
  loader: async () => getPrivateData(),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const privateData = Route.useLoaderData();

  useEffect(() => {
    if (isPending) {
      return;
    }
    if (!session) {
      navigate({ to: '/login' });
    }
  }, [session, isPending, navigate]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session?.user.name}</p>
      <p>privateData: {privateData.message}</p>
    </div>
  );
}
