import { vi } from 'vitest';

// Simple mock - we don't need to test PostHog's internals
export const PostHog = vi.fn().mockImplementation(() => ({
  capture: vi.fn(),
  identify: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
  shutdown: vi.fn().mockResolvedValue(undefined),
}));