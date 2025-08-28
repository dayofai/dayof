import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { zValidator } from '@hono/zod-validator';
import { createLogger } from './utils/logger';
import type { Env } from './types';
import type { MiddlewareHandler, ExecutionContext } from 'hono';

import {
  RegisterDeviceBodySchema,
  PassPathParamsSchema,
  PassIdParamsSchema,
  DevicePassRegistrationsParamsSchema,
  LogMessagesBodySchema
} from './schemas';
import { formatZodError } from './utils/errorHandling';

// Mock storage for smoke tests (no database calls)
const mockStorage = {
  registerDevice: async () => ({ success: true }),
  unregisterDevice: async () => ({ success: true }),
  getPassData: async () => null,
  listUpdatedSerials: async () => ({ serialNumbers: [], lastUpdated: "test" }),
  storeLogMessages: async () => ({ success: true }),
  healthCheck: async () => ({ status: "connected", responseTime: "1ms" }),
};

const enhancedLogger = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
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

// Custom body size checker that properly handles large payloads before JSON parsing
const customBodySizeCheck = (maxSize: number, message: string): MiddlewareHandler => {
  return async (c, next) => {
    // Check Content-Length header first
    const contentLength = c.req.header('Content-Length');
    
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSize) {
        return c.json({ 
          error: 'Payload Too Large',
          message 
        }, 413);
      }
    } else if (c.req.method === 'POST' || c.req.method === 'PUT' || c.req.method === 'PATCH') {
      // For POST/PUT/PATCH requests without Content-Length, read and check body size
      try {
        const clonedRequest = c.req.raw.clone();
        const bodyText = await clonedRequest.text();
        const actualSize = new TextEncoder().encode(bodyText).length;
        
        if (actualSize > maxSize) {
          return c.json({ 
            error: 'Payload Too Large',
            message 
          }, 413);
        }
      } catch (error) {
        // If we can't read the body, continue and let downstream middleware handle it
      }
    }

    await next();
  };
};

// Mock route handlers for smoke tests
const handleRootHealth = (c: any) => {
  return c.json({ message: 'PassKit API', version: '1.0.0' });
};

const handleV1Health = async (c: any) => {
  const healthResult = await mockStorage.healthCheck();
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: healthResult,
  });
};

const handleRegisterDevice = async (c: any) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('ApplePass ')) {
    return c.json({ error: 'Invalid authorization' }, 401);
  }

  const token = authHeader.replace('ApplePass ', '');
  if (token !== 'valid-test-token') {
    return c.json({ error: 'Invalid authorization token' }, 401);
  }

  await mockStorage.registerDevice();
  return c.body(null, 201);
};

const handleUnregisterDevice = async (c: any) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('ApplePass ')) {
    return c.json({ error: 'Invalid authorization' }, 401);
  }

  const token = authHeader.replace('ApplePass ', '');
  if (token !== 'valid-test-token') {
    return c.json({ error: 'Invalid authorization token' }, 401);
  }

  await mockStorage.unregisterDevice();
  return c.body(null, 200);
};

const handleGetPassFile = async (c: any) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('ApplePass ')) {
    return c.json({ error: 'Invalid authorization' }, 401);
  }

  const token = authHeader.replace('ApplePass ', '');
  if (token !== 'test-auth-smoke-12345') {
    return c.json({ error: 'Invalid authorization token' }, 401);
  }

  const ifNoneMatch = c.req.header('if-none-match');
  if (ifNoneMatch === '"test-etag"') {
    return c.body(null, 304);
  }

  // Mock: always return 404 for non-existent passes in smoke tests after auth check
  return c.json({ error: 'Pass not found' }, 404);
};

const handleListUpdatedSerials = async (c: any) => {
  const result = await mockStorage.listUpdatedSerials();
  return c.json(result);
};

const handleLogMessages = async (c: any) => {
  const { logs } = c.req.valid('json');
  const requestId = c.get('requestId');
  const logger = createLogger(c);
  
  for (const message of logs) {
    logger.info('[PassKit Log]', { requestId, messageContent: message });
  }

  await mockStorage.storeLogMessages();
  return c.body(null, 200);
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
    customBodySizeCheck(10 * 1024, 'Push registration payload exceeds 10KB limit'),
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
    zValidator('param', PassIdParamsSchema, formatZodError),
    handleGetPassFile
  );
  
  v1.post('/log',
    apiSecurityConfig,
    customBodySizeCheck(256 * 1024, 'Log payload exceeds 256KB limit'),
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
    
    // Enhanced Logger
    app.use('*', enhancedLogger());
    
    // Global Secure Headers
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
    
    // Global Body Limit
    app.use('*', customBodySizeCheck(2 * 1024 * 1024, 'Request exceeds the 2MB size limit'));

    // Admin routes (mock basic auth)
    app.use('/admin/*', async (c, next) => {
      const authHeader = c.req.header('authorization');
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const credentials = atob(authHeader.replace('Basic ', ''));
      if (credentials !== 'admin:secret') {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      await next();
    });

    app.get('/admin/certs/:certId', async (c) => {
      return c.json({ error: 'Certificate not found' }, 404);
    });

    app.post('/admin/invalidate/certs/:certId', async (c) => {
      return c.json({ error: 'Certificate not found' }, 404);
    });
    
    // Mount v1 routes
    app.route('/v1', createV1App(env));
    
    // Root health route
    app.get('/', handleRootHealth);
    
    return app.fetch(request, env, ctx);
  }
};