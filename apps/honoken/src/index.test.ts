import { Hono } from 'hono';
import { applePassAuthMiddleware, pkpassEtagMiddleware } from './middleware/index';
import { secureHeaders } from 'hono/secure-headers';
import type { Env } from './types';
import { bodyLimit } from 'hono/body-limit';
import type { MiddlewareHandler, ExecutionContext } from 'hono';
import { createLogger } from './utils/logger';

import { zValidator } from '@hono/zod-validator';
import {
  RegisterDeviceBodySchema,
  PassPathParamsSchema,
  PassIdParamsSchema,
  DevicePassRegistrationsParamsSchema,
  LogMessagesBodySchema
} from './schemas';
import { formatZodError } from './utils/errorHandling';

import { handleRegisterDevice } from './routes/registerDeviceRoute';
import { handleUnregisterDevice } from './routes/unregisterDeviceRoute';
import { handleListUpdatedSerials } from './routes/listUpdatedSerialsRoute';
import { handleGetPassFile } from './routes/getPassFileRoute';
import { handleLogMessages } from './routes/logMessagesRoute';
import { handleV1Health } from './routes/v1HealthRoute';
import { handleRootHealth } from './routes/rootHealthRoute';
import adminRoutes from './routes/admin';

const enhancedLogger = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    // Generate or extract request ID (prefer CF-Request-ID if available)
    const requestId = c.req.header('CF-Request-ID') || crypto.randomUUID();
    
    c.set('requestId', requestId);

    const logger = createLogger(c);
    
    const { method } = c.req;
    const path = c.req.path;
    const userAgent = c.req.header('User-Agent');

    logger.info('request', {
      type: 'request',
      method,
      path,
      userAgent,
    });
    
    const start = Date.now();
    
    try {
      await next(); 

      c.res.headers.set('X-Request-ID', requestId); 

      const responseTime = Date.now() - start;
      logger.info('response', {
        type: 'response',
        method,
        path,
        status: c.res.status,
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      if (c.res && typeof c.res.headers !== 'undefined' && typeof c.res.headers.set === 'function') {
        c.res.headers.set('X-Request-ID', requestId);
      }

      const responseTime = Date.now() - start;
      logger.error('error', error, {
        type: 'error',
        method,
        path,
        status: c.res ? c.res.status : 500,
        responseTime: `${responseTime}ms`,
      });
      throw error; 
    }
  };
};

function createV1App(env: Env) {
  const v1 = new Hono<{ Bindings: Env }>();
  
  const apiSecurityConfig = secureHeaders({
    xFrameOptions: 'DENY',
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      connectSrc: ["'self'"]
    },
  });
  
  v1.post('/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
    apiSecurityConfig,
    bodyLimit({
      maxSize: 10 * 1024, // 10KB
      onError: (c) => c.json({ 
        error: 'Payload Too Large',
        message: 'Push registration payload exceeds 10KB limit' 
      }, 413)
    }),
    zValidator('param', PassPathParamsSchema, formatZodError),
    zValidator('json', RegisterDeviceBodySchema, formatZodError),
    handleRegisterDevice
  );
  
  v1.delete('/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
    apiSecurityConfig,
    zValidator('param', PassPathParamsSchema, formatZodError),
    handleUnregisterDevice
  );
  
  v1.get('/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier',
    apiSecurityConfig,
    zValidator('param', DevicePassRegistrationsParamsSchema, formatZodError),
    handleListUpdatedSerials
  );
  
  v1.get('/passes/:passTypeIdentifier/:serialNumber',
    secureHeaders({
      crossOriginResourcePolicy: 'cross-origin',
      xFrameOptions: false,
    }),
    applePassAuthMiddleware,
    pkpassEtagMiddleware,
    zValidator('param', PassIdParamsSchema, formatZodError),
    handleGetPassFile
  );
  
  v1.post('/log',
    apiSecurityConfig,
    bodyLimit({
      maxSize: 256 * 1024, // 256KB
      onError: (c) => c.json({ 
        error: 'Payload Too Large',
        message: 'Log payload exceeds 256KB limit' 
      }, 413)
    }),
    zValidator('json', LogMessagesBodySchema, formatZodError),
    handleLogMessages
  );
  
  v1.get('/health',
    apiSecurityConfig,
    handleV1Health
  );
  
  return v1;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const app = new Hono<{ Bindings: Env }>();
    
    // Simplified test version without Sentry and OpenTelemetry
    app.use('*', enhancedLogger());
    
    app.use('*', secureHeaders({
      strictTransportSecurity: 'max-age=63072000; includeSubDomains',
      xContentTypeOptions: 'nosniff',
      xDnsPrefetchControl: 'off',
      referrerPolicy: 'strict-origin-when-cross-origin',
      xXssProtection: '0',
      xPermittedCrossDomainPolicies: 'none',
      crossOriginResourcePolicy: 'same-origin',
      crossOriginOpenerPolicy: 'same-origin',
    }));
    
    app.use('*', bodyLimit({
      maxSize: 2 * 1024 * 1024, // 2MB global default
      onError: (c) => {
        return c.json({ 
          error: 'Payload Too Large',
          message: 'Request exceeds the 2MB size limit' 
        }, 413);
      }
    }));
    
    // Mount v1 routes
    app.route('/v1', createV1App(env));
    
    app.route('/', adminRoutes);
    
    app.get('/', handleRootHealth);

    return app.fetch(request, env, ctx);
  }
};