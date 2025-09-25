import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // SPA mode: let client default to window origin and default /api/auth path
  fetchOptions: { credentials: 'include' },
});
