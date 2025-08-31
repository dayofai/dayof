import { inngest } from '../client';

export const userSignedIn = inngest.createFunction(
  { id: 'user-signed-in' },
  { event: 'user/signed_in' },
  async ({ event, step }) => {
    const data = event.data as unknown;
    let userId: string | undefined;
    if (typeof data === 'object' && data !== null && 'userId' in data) {
      const value = (data as Record<string, unknown>).userId;
      if (typeof value === 'string') {
        userId = value;
      }
    }

    await step.run('log', () => {
      return { message: 'User signed in', userId };
    });
    return { ok: true };
  }
);
