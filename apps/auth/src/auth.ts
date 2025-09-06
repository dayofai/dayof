import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from 'database/db';

const BASE_URL = process.env.BETTER_AUTH_URL; // e.g. https://auth.dayof.ai/auth
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN; // prod only: dayof.ai

export const auth = betterAuth({
  baseURL: BASE_URL,
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [expo()],
  ...(COOKIE_DOMAIN
    ? {
        advanced: {
          crossSubDomainCookies: {
            enabled: true,
            domain: COOKIE_DOMAIN,
          },
        },
      }
    : {}),
  trustedOrigins: (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
});
