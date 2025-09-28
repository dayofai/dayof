import { createFileRoute } from '@tanstack/react-router';

const AUTH_PROXY_BASE =
  import.meta.env.VITE_AUTH_PROXY_BASE || process.env.AUTH_PROXY_BASE;

async function proxyHandler({ request }: { request: Request }) {
  if (!AUTH_PROXY_BASE) {
    return new Response('Missing AUTH_PROXY_BASE', { status: 500 });
  }

  const url = new URL(request.url);
  // Strip /auth from the path to forward clean URLs
  // Frontend: /auth/sign-in → Auth service: /sign-in
  const pathWithoutPrefix = url.pathname.replace('/auth', '');
  const target = new URL(pathWithoutPrefix + url.search, AUTH_PROXY_BASE);

  const method = request.method;
  const isBodyless = method === 'GET' || method === 'HEAD';
  const headers = new Headers(request.headers);
  headers.delete('content-length');
  headers.delete('host');

  const body = isBodyless ? undefined : await request.text();

  const res = await fetch(target.toString(), {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  return res;
}

// Use createFileRoute() without explicit path - TanStack Router infers from file location
export const Route = createFileRoute('/auth/$')({
  server: {
    handlers: {
      GET: proxyHandler,
      POST: proxyHandler,
      PUT: proxyHandler,
      PATCH: proxyHandler,
      DELETE: proxyHandler,
      OPTIONS: proxyHandler,
    },
  },
});
