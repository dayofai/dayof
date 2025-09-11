import type { Config } from 'drizzle-kit';

const url =
  process.env.TEMP_BRANCH_DATABASE_URL ??
  process.env.DEV_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    'Set TEMP_BRANCH_DATABASE_URL (ephemeral), DEV_DATABASE_URL, or DATABASE_URL'
  );
}

export default {
  schema: './schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
} satisfies Config;
