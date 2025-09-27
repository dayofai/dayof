import { QueryClient } from '@tanstack/react-query';
import { getRouter } from './router';
import type { RouterAppContext } from './routes/__root';

export { createRequestHandler } from '@tanstack/react-start/server';

export default function createHandler() {
  const queryClient = new QueryClient();
  const context: RouterAppContext = { queryClient };
  const router = getRouter(context);
  return createRequestHandler({ router });
}
