import { createFileRoute } from '@tanstack/react-router';

const AUTH_PROXY_BASE =
  import.meta.env.VITE_AUTH_PROXY_BASE || process.env.AUTH_PROXY_BASE;
const API_AUTH_PREFIX = /^\/api\/auth/;

async function proxyHandler({ request }: { request: Request }) {
  if (!AUTH_PROXY_BASE) {
    return new Response('Missing AUTH_PROXY_BASE', { status: 500 });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(API_AUTH_PREFIX, '');
  const target = new URL(path + url.search, AUTH_PROXY_BASE);

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
    duplex: 'half',
  });

  return res;
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
