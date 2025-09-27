export const config = { runtime: 'edge' };

const AUTH_PROXY_BASE = process.env.AUTH_PROXY_BASE;
const API_AUTH_PREFIX = /^\/api\/auth/;

export default async function handler(req: Request) {
  if (!AUTH_PROXY_BASE) {
    return new Response('Missing AUTH_PROXY_BASE', { status: 500 });
  }

  const url = new URL(req.url);
  const target = new URL(
    url.pathname.replace(API_AUTH_PREFIX, '') + url.search,
    AUTH_PROXY_BASE
  );

  const method = req.method;
  const isBodyless = method === 'GET' || method === 'HEAD';
  const headers = new Headers(req.headers);
  headers.delete('content-length');
  headers.delete('host');

  const body = isBodyless ? undefined : await req.text();

  const res = await fetch(target.toString(), {
    method,
    headers,
    body,
    redirect: 'manual',
    // Required by undici when sending a body in Node runtimes
    duplex: 'half',
  });
  return res;
}
