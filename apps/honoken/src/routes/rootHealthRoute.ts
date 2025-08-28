import type { Context } from 'hono';
import type { Env } from '../types';

export const handleRootHealth = (c: Context<{ Bindings: Env }>) => {
  return c.json({ message: 'PassKit API', version: '1.0.0' });
}; 