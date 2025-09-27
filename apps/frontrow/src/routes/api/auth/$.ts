import { createFileRoute } from '@tanstack/react-router';

const AUTH_PROXY_BASE = process.env.AUTH_PROXY_BASE;
const API_AUTH_PREFIX = /^\/api\/auth/;

async function proxyHandler({ request }: { request: Request }) {
  if (!AUTH_PROXY_BASE) {
    return new Response('Missing AUTH_PROXY_BASE', { status: 500 });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(API_AUTH_PREFIX, '');
  const target = new URL(path + url.search, AUTH_PROXY_BASE);

  const res = await fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : request.body,
    redirect: 'manual',
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
