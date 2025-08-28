import type { Context } from 'hono';
import type { Env } from '../types';
import { buildPass } from '../passkit/passkit';
import type { PassIdParams } from '../schemas';
import { createLogger } from '../utils/logger';

export const handleGetPassFile = async (c: Context<{ Bindings: Env }>) => {
  const logger = createLogger(c);
  
  const { passTypeIdentifier, serialNumber } = c.req.valid('param') as PassIdParams;

  try {
    logger.info('Generating pass file', { passTypeIdentifier, serialNumber });
    
    // NOTE: Conditional request handling (If-None-Match, If-Modified-Since) is managed
    // by pkpassEtagMiddleware to ensure RFC 7232 compliance. The middleware handles:
    // - Proper precedence (If-None-Match before If-Modified-Since)
    // - Complete header sets on 304 responses (ETag and Last-Modified)
    // - Consistent cache control directives
    // Do NOT add conditional logic here - it belongs in the middleware layer only.
    
    const passBuffer = await buildPass(c.env, passTypeIdentifier, serialNumber, logger);
    
    if (!passBuffer) {
      logger.error('Pass Generation Failed for unknown reasons after buildPass call', new Error('NO_PASS_BUFFER'), { passTypeIdentifier, serialNumber });
      return c.json({ error: 'Pass Generation Failed', message: 'Failed to generate pass buffer for unknown reasons.' }, 500);
    }

    c.header('Content-Type', 'application/vnd.apple.pkpass');
    c.header('Content-Disposition', `attachment; filename="${serialNumber}.pkpass"`);
    // ETag, Last-Modified, and Cache-Control headers are handled by pkpassEtagMiddleware

    logger.info('Pass generated successfully', {
      passTypeIdentifier,
      serialNumber,
      bufferSize: passBuffer.byteLength
    });
    return c.body(passBuffer, 200);

  } catch (error: any) {
    logger.error('Error in handleGetPassFile', error as Error, { passTypeIdentifier, serialNumber, originalErrorMessage: error.message });
    
    if (error.message === 'PASS_NOT_FOUND' || error.message === 'PASS_TYPE_MISMATCH') {
      return c.json({ error: 'Pass Not Found or Unauthorized', message: 'The requested pass could not be found or access is not permitted.' }, 404); // Or 401 if auth is implied
    }
    if (error.message && error.message.startsWith('Server configuration error')) {
      return c.json({ error: 'Pass Configuration Error', message: 'There was an issue with the server configuration for this pass.' }, 500);
    }
    if (error.message && error.message.startsWith('CERT_BUNDLE_LOAD_ERROR')) {
      return c.json({ error: 'Pass Security Configuration Error', message: 'Could not load necessary security components for the pass.' }, 500);
    }
    if (error.message === 'PASS_DATA_INVALID_JSON') {
      return c.json({ error: 'Invalid Pass Data', message: 'The stored data for this pass is malformed (invalid JSON).' }, 500);
    }
    if (error.message && error.message.startsWith('PASS_DATA_VALIDATION_ERROR:')) {
      const userMessage = error.message.substring('PASS_DATA_VALIDATION_ERROR: '.length);
      return c.json({
        error: 'Invalid Pass Content',
        message: 'The content provided for this pass is invalid or incomplete.',
        details: userMessage 
      }, 400); // Using 400 as per discussion, could be 500 depending on interpretation
    }
    if (error.message && error.message.startsWith('UNSUPPORTED_TICKET_STYLE')) {
      return c.json({ error: 'Unsupported Pass Type', message: 'The requested pass style is not currently supported for validation.'}, 501);
    }
    if (error.message && (error.message.startsWith('Mandatory logo.png not found') || error.message.startsWith('icon.png is mandatory') || error.message.includes('has incorrect dimensions'))) {
      logger.warn('Pass Asset Error encountered during pass generation', { passTypeIdentifier, serialNumber, errorDetails: error instanceof Error ? error.message : String(error) });
      return c.json({ error: 'Pass Asset Error', message: 'A required image asset for the pass could not be found or has incorrect dimensions.' }, 500);
    }
    if (error.message === 'UNEXPECTED_BUFFER_TYPE') {
      logger.error('Unexpected buffer type from passkit-generator', error, { passTypeIdentifier, serialNumber });
      return c.json({ error: 'Pass Generation Error', message: 'An internal error occurred while generating the pass file.'}, 500);
    }
    return c.json({ error: 'Internal Server Error', message: 'An unexpected error occurred while fetching the pass.' }, 500);
  }
}; 