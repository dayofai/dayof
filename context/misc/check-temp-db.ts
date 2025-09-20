import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

function readVar(filePath: string, key: string): string | undefined {
  const content = readFileSync(filePath, 'utf8');
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!match) {
    return;
  }
  const raw = match[1].trim();
  return raw.replace(/^"|"$/g, '');
}

async function tryConnect(label: string, url?: string): Promise<void> {
  if (!url) {
    console.log(JSON.stringify({ label, ok: false, error: 'missing' }));
    return;
  }
  try {
    const start = Date.now();
    const sql = neon(url);
    const rows = await sql<{
      db: string;
      usr: string;
    }>`select current_database() as db, current_user as usr`;
    const elapsedMs = Date.now() - start;
    console.log(
      JSON.stringify({
        label,
        ok: true,
        db: rows[0]?.db,
        user: rows[0]?.usr,
        elapsedMs,
      })
    );
  } catch (err) {
    console.log(
      JSON.stringify({
        label,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }
}

async function main(): Promise<void> {
  const baseline = readVar('.env.local', 'DATABASE_URL');
  const temp = readVar(
    'packages/database/.env.local',
    'TEMP_BRANCH_DATABASE_URL'
  );
  await tryConnect('baseline', baseline);
  await tryConnect('temp', temp);
  if (temp) {
    const u = new URL(temp);
    const params = new URLSearchParams(u.search);
    if (params.has('channel_binding')) {
      params.delete('channel_binding');
      u.search = params.toString() ? `?${params.toString()}` : '';
      await tryConnect('temp_no_channel_binding', u.toString());
    }
  }
}

main().catch((err) => {
  console.error('Connection test failed:', err?.message || err);
  process.exit(1);
});
