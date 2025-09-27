import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware } from 'better-auth/api';
import { reactStartCookies } from 'better-auth/react-start';
import { db } from 'database/db';
import { inngest } from 'inngest-kit';

const BASE_URL = process.env.BETTER_AUTH_URL; // e.g. https://auth.dayof.ai/auth
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN; // prod only: dayof.ai
const SECRET = process.env.BETTER_AUTH_SECRET;

export const auth = betterAuth({
  baseURL: BASE_URL,
  secret: SECRET,
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [expo(), reactStartCookies()],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      try {
        if (ctx.path.startsWith('/sign-in')) {
          const session = ctx.context.newSession as
            | { userId?: string }
            | undefined;
          const userId = session?.userId;
          if (userId) {
            await inngest.send({
              name: 'user/signed_in',
              data: { userId },
            });
          }
        } else if (ctx.path.startsWith('/sign-up')) {
          const session = ctx.context.newSession as
            | { userId?: string }
            | undefined;
          const userId = session?.userId;
          if (userId) {
            await inngest.send({
              name: 'user/signed_up',
              data: { userId },
            });
          }
        } else if (
          ctx.path.startsWith('/sign-out') ||
          ctx.path.startsWith('/revoke-session') ||
          ctx.path.startsWith('/revoke-sessions')
        ) {
          const current = ctx.context.session as
            | { userId?: string }
            | undefined;
          const userId = current?.userId;
          if (userId) {
            await inngest.send({
              name: 'session/revoked',
              data: { userId },
            });
          }
        } else if (ctx.path.startsWith('/user/update')) {
          const current = ctx.context.session as
            | { userId?: string }
            | undefined;
          const userId = current?.userId;
          if (userId) {
            await inngest.send({
              name: 'user/updated',
              data: { userId },
            });
          }
        }
      } catch {
        // non-blocking: ignore event errors
      }
    }),
  },
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
