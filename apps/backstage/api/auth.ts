export const config = { runtime: 'edge' };

const AUTH_PROXY_BASE = process.env.AUTH_PROXY_BASE;

export default async function handler(req: Request) {
  if (!AUTH_PROXY_BASE) {
    return new Response('Missing AUTH_PROXY_BASE', { status: 500 });
  }

  const url = new URL(req.url);
  const target = new URL(url.pathname + url.search, AUTH_PROXY_BASE);

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
  });
  return res;
}
