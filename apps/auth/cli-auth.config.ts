import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
  admin,
  anonymous,
  jwt,
  magicLink,
  organization,
  phoneNumber,
} from 'better-auth/plugins';
import type { DB } from 'database/db';

// Minimal config for CLI schema generation only.
// Uses a stub DB object to avoid importing the real database client.
export default betterAuth({
  baseURL: 'http://localhost/auth',
  database: drizzleAdapter({} as DB, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [
    organization(),
    phoneNumber({ sendOTP: async () => Promise.resolve() }),
    magicLink({ sendMagicLink: async () => Promise.resolve() }),
    anonymous(),
    admin(),
    jwt(),
  ],
});
