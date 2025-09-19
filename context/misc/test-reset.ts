import { readFileSync } from 'node:fs';

async function main(): Promise<void> {
  const apps = [
    'apps/events/.env.local',
    'apps/backstage/.env.local',
    'apps/auth/.env.local',
    'apps/frontrow/.env.local',
    'apps/honoken/.env.local',
  ];
  let apiKey = '';
  let projectId = '';
  for (const p of apps) {
    try {
      const t = readFileSync(p, 'utf8');
      if (!apiKey) {
        const m = t.match(/^NEON_API_KEY=(?:"|')?([^"'\n]+)/m);
        if (m) apiKey = m[1];
      }
      if (!projectId) {
        const m = t.match(/^NEON_PROJECT_ID=(?:"|')?([^"'\n]+)/m);
        if (m) projectId = m[1];
      }
    } catch {}
  }
  if (!(apiKey && projectId)) {
    throw new Error('Missing NEON_API_KEY or NEON_PROJECT_ID');
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  } as const;

  const listRes = await fetch(
    `https://console.neon.tech/api/v2/projects/${projectId}/branches`,
    { headers }
  );
  const list = (await listRes.json()) as {
    branches: Array<{ id: string; name: string; created_at: string }>;
  };
  const candidates = list.branches.filter((b) => b.name.startsWith('temp'));
  candidates.sort((a, b) => a.created_at.localeCompare(b.created_at)).reverse();
  const branchId = candidates[0]?.id;
  if (!branchId) throw new Error('No temp branch found');

  const role = 'dayof_owner';
  const url = `https://console.neon.tech/api/v2/projects/${projectId}/branches/${encodeURIComponent(
    branchId
  )}/roles/${encodeURIComponent(role)}/reset_password`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
  });
  const text = await res.text();
  console.log(res.status);
  console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
