import type { Context } from 'hono';
import type { PostHog } from 'posthog-node';
import type { PassPathParams, RegisterDevicePayload } from '../schemas';
import { registerDevice } from '../storage';
import type { Env } from '../types';
import { createLogger, type Logger } from '../utils/logger';

export const handleRegisterDevice = async (c: Context<{ Bindings: Env }>) => {
  const logger = createLogger(c);
  const posthog = c.get('posthog') as PostHog | undefined;
  const params = c.req.valid('param');
  const body = c.req.valid('json');

  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } =
    params as PassPathParams;
  const { pushToken } = body as RegisterDevicePayload;

  const authorizationHeader = c.req.header('Authorization');

  try {
    const result = await registerDevice(
      c.env,
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
      pushToken,
      authorizationHeader,
      logger,
      posthog
    );

    if (result.success) {
      return c.json(
        {
          message:
            result.message ||
            (result.status === 201
              ? 'Registration created.'
              : 'Registration active.'),
        },
        result.status as any
      );
    }
    return c.json(
      {
        error: 'Registration Failed',
        message: result.message || 'Could not process registration.',
      },
      result.status as any
    );
  } catch (error: any) {
    logger.error('Critical error in handleRegisterDevice', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected critical error occurred.',
      },
      500
    );
  }
};
