import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main(): Promise<void> {
  const home = process.env.HOME || process.env.USERPROFILE || '.';
  const cfgPath = resolve(home, '.config', 'dayof', 'neon.json');
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8')) as {
    NEON_API_KEY: string;
    NEON_PROJECT_ID: string;
  };
  const last = JSON.parse(readFileSync('.neon-last-branch', 'utf8')) as {
    id: string;
    name: string;
  };

  const apiBase = 'https://console.neon.tech/api/v2';
  const headers = {
    Authorization: `Bearer ${cfg.NEON_API_KEY}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  } as const;

  const rolesUrl = `${apiBase}/projects/${cfg.NEON_PROJECT_ID}/roles?branch_id=${encodeURIComponent(
    last.id
  )}`;
  const rolesRes = await fetch(rolesUrl, { headers });
  console.log('roles status', rolesRes.status);
  const rolesText = await rolesRes.text();
  console.log(rolesText.slice(0, 1500));

  try {
    const parsed = JSON.parse(rolesText) as any;
    const role =
      (parsed.roles || []).find((r: any) => r.name === 'dayof_owner') ||
      (parsed.data || []).find((r: any) => r.name === 'dayof_owner');
    if (role?.id) {
      const newPass = `npg_${Math.random().toString(36).slice(2, 14)}`;
      const resetUrl1 = `${apiBase}/projects/${cfg.NEON_PROJECT_ID}/roles/${role.id}/reset_password`;
      const resetRes1 = await fetch(resetUrl1, {
        method: 'POST',
        headers,
        body: JSON.stringify({ password: newPass }),
      });
      console.log('reset1 status', resetRes1.status);
      const resetText1 = await resetRes1.text();
      console.log(resetText1.slice(0, 800));
    }
  } catch {}
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
