import { QueryClient } from '@tanstack/react-query';
import { createRequestHandler } from '@tanstack/react-start/server';
import { getRouter } from './router';
import type { RouterAppContext } from './routes/__root';

export default createRequestHandler(({ request }) => {
  const queryClient = new QueryClient();
  const context: RouterAppContext = { queryClient };
  const router = getRouter(context);
  return { router };
});
