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

// Minimal config for CLI schema generation only.
// Uses a stub DB object to avoid importing the real database client.
export default betterAuth({
  baseURL: 'http://localhost/auth',
  database: drizzleAdapter({} as any, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [
    organization(),
    phoneNumber({ sendOTP: async () => {} }),
    magicLink({ sendMagicLink: async () => {} }),
    anonymous(),
    admin(),
    jwt(),
  ],
});
