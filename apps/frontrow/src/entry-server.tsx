import { createRequestHandler } from '@tanstack/react-start/server';
import { getRouter } from './router';

// Nitro/Vercel entry point - creates a fresh router for each SSR request
// The function signature works correctly at runtime despite type inference issues
export default createRequestHandler(() => {
  const router = getRouter();
  return { router };
});
