import type { Config } from 'drizzle-kit';

export default {
  schema: './schema/**/*.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Use a dev branch URL for local generation; do not commit secrets
    url: process.env.DEV_DATABASE_URL as string,
  },
} satisfies Config;
