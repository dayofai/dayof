import { hydrate } from '@tanstack/react-start/client';
import { getRouter } from './router';

const router = getRouter();

hydrate(router);
