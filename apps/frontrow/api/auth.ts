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

  const res = await fetch(target.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
    redirect: 'manual',
  });
  return res;
}
