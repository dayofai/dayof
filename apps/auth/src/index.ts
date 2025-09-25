// Export Hono app as default for Vercel to mount at domain root
// This allows Better Auth endpoints like /get-session, /sign-in to work correctly
export { default } from './app';
