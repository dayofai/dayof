import { Hono } from 'hono';
import { applePassAuthMiddleware, pkpassEtagMiddleware } from './middleware/index';
import { secureHeaders } from 'hono/secure-headers';
import type { Env } from './types';
import { bodyLimit } from 'hono/body-limit';
import type { MiddlewareHandler } from 'hono';
import { createLogger } from './utils/logger';
import { posthogMiddleware, startPeriodicHealthCheck } from './utils/posthog';
import type { PostHog } from 'posthog-node';

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
import { validateEnv } from './utils/validateEnv';

// Vercel Node.js runtime handles unhandled rejections automatically

// Create enhanced logger middleware optimized for Fluid Compute
const enhancedLogger = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    const requestId = crypto.randomUUID();
    c.set('requestId', requestId);
    
    const logger = createLogger(c);
    const { method } = c.req;
    const path = c.req.path;
    const userAgent = c.req.header('User-Agent');
    
    // In Fluid Compute, we can track more detailed metrics
    const processInfo = {
      pid: process.pid,
      uptime: process.uptime(),
      memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };

    logger.info('request_start', {
      method,
      path,
      userAgent,
      ...processInfo,
    });
    
    const start = Date.now();
    
    try {
      await next();
      
      if (c.res) {
        c.res.headers.set('X-Request-ID', requestId);
        // Add process ID to help track container lifecycle
        c.res.headers.set('X-Process-ID', process.pid.toString());
      }
      
      const responseTime = Date.now() - start;
      
      // Enhanced sampling for Fluid Compute - we can afford more detailed tracking
      const sampleRate = parseFloat(c.env.LOG_SAMPLE_SUCCESS_RATE || "0.01");
      const shouldSample = c.res && c.res.status >= 200 && c.res.status < 300 && 
                          Math.random() < sampleRate;
      
      if (shouldSample) {
        logger.info('request_ok_sampled', {
          method,
          path,
          status: c.res.status,
          responseTime_ms: responseTime,
          ...processInfo,
        });
      }
      
      // Always log completion
      if (c.res) {
        logger.info('response_end', {
          method,
          path,
          status: c.res.status,
          responseTime_ms: responseTime,
        });
      }
    } catch (error) {
      if (c.res?.headers) {
        c.res.headers.set('X-Request-ID', requestId);
        c.res.headers.set('X-Process-ID', process.pid.toString());
      }
      
      const responseTime = Date.now() - start;
      
      // Use errorAsync for unhandled errors in middleware
      await logger.errorAsync(
        'Unhandled error in request pipeline',
        error,
        {
          method,
          path,
          status: (error as any)?.status || 500,
          responseTime_ms: responseTime,
          severity: 'critical', // This will trigger a flush
        }
      );
      
      throw error; // Re-throw for error handler
    }
  };
};

// Pre-instantiate secure headers middleware for each route pattern
const globalDefaults = {
  strictTransportSecurity: 'max-age=63072000; includeSubDomains',
  xContentTypeOptions: 'nosniff',
  xDnsPrefetchControl: 'off',
  referrerPolicy: 'strict-origin-when-cross-origin',
  xXssProtection: '0',
  xPermittedCrossDomainPolicies: 'none',
  crossOriginResourcePolicy: 'same-origin',
  crossOriginOpenerPolicy: 'same-origin',
  // CSP is not set globally by default, only for specific paths
};

// Pre-create middleware instances for better performance
const passesSecureHeaders = secureHeaders({
  ...globalDefaults,
  crossOriginResourcePolicy: 'cross-origin',
  xFrameOptions: false, // Explicitly false for passes
  crossOriginOpenerPolicy: 'same-origin', // Important for iOS 17 privacy pop-ups
  // No CSP for passes
});

const v1SecureHeaders = secureHeaders({
  ...globalDefaults,
  xFrameOptions: 'DENY',
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
    connectSrc: ["'self'"]
  },
});

const defaultSecureHeaders = secureHeaders(globalDefaults);

// Dynamic secureHeaders middleware
const dynamicSecureHeaders = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    const requestPath = c.req.path;
    // Normalize path: remove /api prefix if present, as basePath might add it.
    const normalizedPath = requestPath.startsWith('/api/')
      ? requestPath.substring(4) // Remove '/api' (length 4)
      : requestPath;

    if (normalizedPath.startsWith('/v1/passes/')) {
      return passesSecureHeaders(c, next);
    } else if (normalizedPath.startsWith('/v1/')) {
      return v1SecureHeaders(c, next);
    } else {
      // For non-/v1 routes (e.g. admin, root health, or /api/ without /v1/)
      // Apply global defaults.
      // If the original path was /api/something-else, it will get global defaults.
      // If it was /admin, it also gets global defaults.
      return defaultSecureHeaders(c, next);
    }
  };
};

function createV1App() {
  const v1 = new Hono<{ Bindings: Env }>();
  
  v1.post('/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
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
    zValidator('param', PassPathParamsSchema, formatZodError),
    handleUnregisterDevice
  );
  
  v1.get('/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier',
    zValidator('param', DevicePassRegistrationsParamsSchema, formatZodError),
    handleListUpdatedSerials
  );
  
  v1.get('/passes/:passTypeIdentifier/:serialNumber',
    applePassAuthMiddleware,
    pkpassEtagMiddleware,
    zValidator('param', PassIdParamsSchema, formatZodError), // Moved after existing middlewares for consistency, but order with auth/etag might not strictly matter here.
    handleGetPassFile
  );
  
  v1.post('/log',
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
    handleV1Health
  );
  
  return v1;
}

// Create the main app
const app = new Hono<{ Bindings: Env }>();

// Environment validation middleware - runs once on first request
let envValidated = false;
const envValidationMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (!envValidated) {
    try {
      validateEnv(c.env);
      envValidated = true;
    } catch (error) {
      // Log the error details for debugging
      console.error('Environment validation failed:', error);
      // Return a 500 error with minimal details for security
      return c.json({ 
        error: 'Internal Server Error',
        message: 'Service configuration error. Please contact support.',
        requestId: c.get('requestId')
      }, 500);
    }
  }
  return next();
};

// In production with Fluid Compute, start periodic health checks
// This ensures events are sent even during quiet periods
if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
  startPeriodicHealthCheck(60000); // Check every minute
  console.log('Started PostHog periodic health check for Fluid Compute');
}

// Apply environment validation as the first middleware
app.use('*', envValidationMiddleware);

// Initialize PostHog early in the middleware chain
app.use('*', posthogMiddleware);

// Global Body Limit BEFORE logger to prevent memory exhaustion from oversized payloads
// This ensures malicious large requests are rejected before any body reading occurs
app.use('*', bodyLimit({
  maxSize: 2 * 1024 * 1024, // 2MB global default
  onError: (c) => {
    return c.json({ 
      error: 'Payload Too Large',
      message: 'Request exceeds the 2MB size limit' 
    }, 413);
  }
}));

// Request ID generation happens in enhancedLogger
// Now safe to log since oversized bodies are already rejected
app.use('*', enhancedLogger());

// Security headers after logger
app.use('*', dynamicSecureHeaders());

// Update the global error handler
app.onError(async (err, c) => {
  const logger = createLogger(c);
  const requestId = c.get('requestId') as string | undefined;
  const posthog = c.get('posthog') as PostHog | undefined;
  
  // Log through our logger which handles PostHog integration
  await logger.errorAsync('Unhandled application error', err, {
    path: c.req.path,
    method: c.req.method,
    userAgent: c.req.header('User-Agent'),
    url: c.req.url,
    // Add request body for debugging (be careful with PII)
    body: c.req.header('content-type')?.includes('application/json') 
      ? await c.req.raw.clone().text().catch(() => 'Failed to read body')
      : undefined,
    severity: 'critical', // Ensures immediate flush
  });
  
  // Also capture directly to PostHog for redundancy
  if (posthog) {
    const userContext = c.get('userContext');
    const distinctId = userContext?.distinctId || 
                      requestId || 
                      'anonymous-error';
    
    try {
      posthog.capture({
        distinctId,
        event: '$exception',
        properties: {
          $exception_type: err instanceof Error ? err.name : 'UnknownError',
          $exception_message: err instanceof Error ? err.message : String(err),
          $exception_stack_trace_raw: err instanceof Error ? err.stack : undefined,
          $exception_handled: false, // This is an unhandled error
          
          // Rich context for debugging
          path: c.req.path,
          method: c.req.method,
          url: c.req.url,
          statusCode: 500,
          requestId,
          
          // Container context for Fluid Compute
          pid: process.pid,
          containerUptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          
          // Request context (be mindful of PII)
          userAgent: c.req.header('User-Agent'),
          contentType: c.req.header('content-type'),
          query: Object.fromEntries(new URL(c.req.url).searchParams),
        },
      });
      
      // Force flush for unhandled errors
      await posthog.flush();
    } catch (captureError) {
      console.error('Failed to capture unhandled exception to PostHog:', captureError);
    }
  }
  
  return c.json({ 
    error: 'Internal Server Error',
    requestId: requestId || 'unknown',
    // In development, include more error details
    ...(c.env.ENVIRONMENT === 'development' && {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }),
  }, 500);
});

// Mount v1 routes - env will be available via c.env in middleware
app.route('/v1', createV1App());

app.route('/', adminRoutes);

app.get('/', handleRootHealth);

// Export the Hono app instance for Vercel
export const config = { runtime: 'nodejs20.x' };
export default app;
