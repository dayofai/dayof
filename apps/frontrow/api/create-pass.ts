export const config = { runtime: 'edge' };

const ADMIN_ENDPOINT = '/admin/create-test-pass';

function toBasicAuth(user: string, pass: string): string {
  const value = `${user}:${pass}`;
  if (typeof btoa === 'function') {
    return `Basic ${btoa(value)}`;
  }
  // Fallback for environments where btoa is not defined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BufferRef: any = (globalThis as unknown as { Buffer?: unknown }).Buffer;
  if (BufferRef) {
    return `Basic ${BufferRef.from(value, 'utf-8').toString('base64')}`;
  }
  throw new Error('Unable to encode basic auth credentials');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const baseUrl = process.env.HONOKEN_BASE_URL;
  const adminUser = process.env.HONOKEN_ADMIN_USER;
  const adminPass = process.env.HONOKEN_ADMIN_PASS;

  if (!baseUrl || !adminUser || !adminPass) {
    return new Response(
      'Server misconfiguration: HONOKEN_BASE_URL/USER/PASS must be set',
      { status: 500 }
    );
  }

  const upstreamUrl = new URL(ADMIN_ENDPOINT, baseUrl).toString();
  const contentType = req.headers.get('content-type') || 'application/json';
  const bodyText = await req.text();

  const upstreamResponse = await fetch(upstreamUrl, {
    method: 'POST',
    headers: {
      Authorization: toBasicAuth(adminUser, adminPass),
      'Content-Type': contentType,
    },
    body: bodyText,
    cache: 'no-store',
  });

  if (!upstreamResponse.ok) {
    const errorText = await upstreamResponse.text();
    return new Response(errorText || 'Failed to create pass', {
      status: upstreamResponse.status,
    });
  }

  const headers = new Headers();
  headers.set(
    'Content-Type',
    upstreamResponse.headers.get('content-type') || 'application/vnd.apple.pkpass'
  );
  const disposition = upstreamResponse.headers.get('content-disposition');
  if (disposition) {
    headers.set('Content-Disposition', disposition);
  } else {
    headers.set('Content-Disposition', 'attachment; filename="ticket.pkpass"');
  }

  return new Response(upstreamResponse.body, {
    status: 200,
    headers,
  });
}