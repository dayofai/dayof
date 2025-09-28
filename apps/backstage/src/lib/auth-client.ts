import { createAuthClient } from 'better-auth/react';

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: '/api/auth', // Use local proxy for same-origin requests (no CORS)
    fetchOptions: {
      credentials: 'include',
    },
  }
);
