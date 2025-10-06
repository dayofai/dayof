export const isServer = typeof window === 'undefined';
export const isBrowser = !isServer;

export function getRuntime(): 'server' | 'browser' {
  return isServer ? 'server' : 'browser';
}
