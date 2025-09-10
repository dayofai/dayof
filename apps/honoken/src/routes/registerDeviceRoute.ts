import type { Context } from 'hono';
import type { PostHog } from 'posthog-node';
import type { PassPathParams, RegisterDevicePayload } from '../schemas';
import { registerDevice } from '../storage';
import type { Env } from '../types';
import { toErrorStatus, toOkStatus } from '../utils/http';
import { createLogger } from '../utils/logger';

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
      const okStatus = toOkStatus(result.status);
      return c.json(
        {
          message:
            result.message ||
            (okStatus === 201
              ? 'Registration created.'
              : 'Registration active.'),
        },
        okStatus
      );
    }
    const errStatus = toErrorStatus(result.status);
    return c.json(
      {
        error: 'Registration Failed',
        message: result.message || 'Could not process registration.',
      },
      errStatus
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Critical error in handleRegisterDevice', err);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected critical error occurred.',
      },
      500
    );
  }
};
