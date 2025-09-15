import { createServerFn } from '@tanstack/react-start';

export const getHealth = createServerFn({ method: 'GET' }).handler(() => {
  return true;
});
