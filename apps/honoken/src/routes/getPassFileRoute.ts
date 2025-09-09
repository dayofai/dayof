import type { Context } from 'hono';
import { buildPass } from '../passkit/passkit';
import type { PassIdParams } from '../schemas';
import type { Env } from '../types';
import { createLogger } from '../utils/logger';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: needed complexity
export const handleGetPassFile = async (c: Context<{ Bindings: Env }>) => {
  const logger = createLogger(c);

  const { passTypeIdentifier, serialNumber } = c.req.valid(
    'param'
  ) as PassIdParams;

  try {
    logger.info('Generating pass file', { passTypeIdentifier, serialNumber });

    // NOTE: Conditional request handling (If-None-Match, If-Modified-Since) is managed
    // by pkpassEtagMiddleware to ensure RFC 7232 compliance. The middleware handles:
    // - Proper precedence (If-None-Match before If-Modified-Since)
    // - Complete header sets on 304 responses (ETag and Last-Modified)
    // - Consistent cache control directives
    // Do NOT add conditional logic here - it belongs in the middleware layer only.

    const passBuffer = await buildPass(
      c.env,
      passTypeIdentifier,
      serialNumber,
      logger
    );

    if (!passBuffer) {
      logger.error(
        'Pass Generation Failed for unknown reasons after buildPass call',
        new Error('NO_PASS_BUFFER'),
        { passTypeIdentifier, serialNumber }
      );
      return c.json(
        {
          error: 'Pass Generation Failed',
          message: 'Failed to generate pass buffer for unknown reasons.',
        },
        500
      );
    }

    c.header('Content-Type', 'application/vnd.apple.pkpass');
    c.header(
      'Content-Disposition',
      `attachment; filename="${serialNumber}.pkpass"`
    );
    // ETag, Last-Modified, and Cache-Control headers are handled by pkpassEtagMiddleware

    logger.info('Pass generated successfully', {
      passTypeIdentifier,
      serialNumber,
      bufferSize: passBuffer.byteLength,
    });
    return c.body(passBuffer, 200);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error in handleGetPassFile', err, {
      passTypeIdentifier,
      serialNumber,
      originalErrorMessage: err.message,
    });

    if (
      err.message === 'PASS_NOT_FOUND' ||
      err.message === 'PASS_TYPE_MISMATCH'
    ) {
      return c.json(
        {
          error: 'Pass Not Found or Unauthorized',
          message:
            'The requested pass could not be found or access is not permitted.',
        },
        404
      ); // Or 401 if auth is implied
    }
    if (err.message?.startsWith('Server configuration error')) {
      return c.json(
        {
          error: 'Pass Configuration Error',
          message:
            'There was an issue with the server configuration for this pass.',
        },
        500
      );
    }
    if (err.message?.startsWith('CERT_BUNDLE_LOAD_ERROR')) {
      return c.json(
        {
          error: 'Pass Security Configuration Error',
          message: 'Could not load necessary security components for the pass.',
        },
        500
      );
    }
    if (err.message === 'PASS_DATA_INVALID_JSON') {
      return c.json(
        {
          error: 'Invalid Pass Data',
          message: 'The stored data for this pass is malformed (invalid JSON).',
        },
        500
      );
    }
    if (err.message?.startsWith('PASS_DATA_VALIDATION_ERROR:')) {
      const userMessage = err.message.substring(
        'PASS_DATA_VALIDATION_ERROR: '.length
      );
      return c.json(
        {
          error: 'Invalid Pass Content',
          message:
            'The content provided for this pass is invalid or incomplete.',
          details: userMessage,
        },
        400
      ); // Using 400 as per discussion, could be 500 depending on interpretation
    }
    if (err.message?.startsWith('UNSUPPORTED_TICKET_STYLE')) {
      return c.json(
        {
          error: 'Unsupported Pass Type',
          message:
            'The requested pass style is not currently supported for validation.',
        },
        501
      );
    }
    if (
      err.message &&
      (err.message.startsWith('Mandatory logo.png not found') ||
        err.message.startsWith('icon.png is mandatory') ||
        err.message.includes('has incorrect dimensions'))
    ) {
      logger.warn('Pass Asset Error encountered during pass generation', {
        passTypeIdentifier,
        serialNumber,
        errorDetails: err.message,
      });
      return c.json(
        {
          error: 'Pass Asset Error',
          message:
            'A required image asset for the pass could not be found or has incorrect dimensions.',
        },
        500
      );
    }
    if (err.message === 'UNEXPECTED_BUFFER_TYPE') {
      logger.error('Unexpected buffer type from passkit-generator', err, {
        passTypeIdentifier,
        serialNumber,
      });
      return c.json(
        {
          error: 'Pass Generation Error',
          message: 'An internal error occurred while generating the pass file.',
        },
        500
      );
    }
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while fetching the pass.',
      },
      500
    );
  }
};
