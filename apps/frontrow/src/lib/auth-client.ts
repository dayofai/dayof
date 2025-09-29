import { createAuthClient } from 'better-auth/react';

const isServer = typeof window === 'undefined';

// Provide an absolute origin only on the server (for SSR).
// Set FRONTROW_PUBLIC_SITE_URL in Vercel env, e.g. https://preview.dayof.ai
const serverOrigin = isServer
  ? process.env.FRONTROW_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  : undefined;

export const authClient = createAuthClient({
  // Only set baseURL on the server to an absolute origin.
  baseURL: serverOrigin, // undefined in the browser
  fetchOptions: { credentials: 'include' },
});
