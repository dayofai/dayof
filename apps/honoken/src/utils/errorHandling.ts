import type { Context } from 'hono';
import { z } from 'zod/v4';
import type { $ZodError } from 'zod/v4/core';
import { createLogger } from './logger';

/**
 * Callback function for @hono/zod-validator to format Zod errors.
 * It logs the detailed error for server-side observability and returns a
 * user-friendly JSON response.
 */
export const formatZodError = (
  result:
    | { success: false; error: $ZodError; data?: any }
    | { success: true; data: any; error?: $ZodError },
  c: Context
) => {
  const logger = createLogger(c);
  if (!result.success) {
    // Type guard for result.error ensures it's a $ZodError when success is false.
    // The `data` property might exist on `result` even if `success` is false in some zod-validator versions/setups,
    // but `error` is the key property here.
    const error = result.error;
    const prettyErrorMessage = z.prettifyError(error);

    logger.warn('Validation failed', {
      type: 'validationError',
      requestId: c.get('requestId'),
      path: c.req.path,
      method: c.req.method,
      errorSource: 'zod',
      message: 'Validation failed for incoming request.',
      validation_issues_pretty: prettyErrorMessage,
      validation_issues_structured: error.issues,
    });

    return c.json(
      {
        error: 'Validation Failed',
        message:
          'The provided data is invalid. Please check the details below.',
        // User-facing pretty errors (a single string that lists all issues)
        validation_issues: prettyErrorMessage,
      },
      400
    );
  }
  // If validation is successful, the hook should not return a Response.
  // Hono will then proceed to the next handler in the chain.
  // The `data` is automatically available via `c.req.valid('json')` etc. in subsequent handlers.
};
