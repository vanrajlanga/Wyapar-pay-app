import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Middleware
 *
 * Adds a unique request ID to each incoming request for:
 * - Request tracing across microservices
 * - Debugging and troubleshooting
 * - Log correlation
 * - Performance monitoring
 *
 * The request ID is:
 * - Generated if not present in X-Request-Id header
 * - Attached to the request object
 * - Returned in the response header
 * - Can be used in logs to trace the entire request lifecycle
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use existing request ID if provided, otherwise generate new one
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Attach to request for use in controllers/services
    req['id'] = requestId;

    // Return in response headers for client-side tracking
    res.setHeader('X-Request-Id', requestId);

    // Optional: Log request start with ID
    const startTime = Date.now();

    // Log when response is finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel =
        res.statusCode >= 500
          ? 'error'
          : res.statusCode >= 400
            ? 'warn'
            : 'log';

      console[logLevel]({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.socket.remoteAddress,
      });
    });

    next();
  }
}
