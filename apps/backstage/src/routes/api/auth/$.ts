import { createFileRoute } from '@tanstack/react-router';

const AUTH_PROXY_BASE =
  import.meta.env.VITE_AUTH_PROXY_BASE || process.env.AUTH_PROXY_BASE;

async function proxyHandler({ request }: { request: Request }) {
  if (!AUTH_PROXY_BASE) {
    return new Response('Missing AUTH_PROXY_BASE', { status: 500 });
  }

  const url = new URL(request.url);
  // Forward full path under /api/auth unchanged to the auth service
  // e.g. /api/auth/get-session -> https://auth.../api/auth/get-session
  const target = new URL(url.pathname + url.search, AUTH_PROXY_BASE);

  const method = request.method;
  const isBodyless = method === 'GET' || method === 'HEAD';
  const headers = new Headers(request.headers);
  headers.delete('content-length');
  headers.delete('host');
  headers.set('accept-encoding', 'identity');

  const body = isBodyless ? undefined : await request.text();

  const upstream = await fetch(target.toString(), {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  // Clone and sanitize response headers to avoid decoding conflicts
  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete('content-encoding');
  resHeaders.delete('transfer-encoding');
  resHeaders.delete('content-length');

  const resBody = await upstream.arrayBuffer();
  return new Response(resBody, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const Route = createFileRoute('/api/auth/$')({
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
