import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP Exception Filter
 *
 * Catches all exceptions and formats them for consistent error responses
 * while preventing sensitive information leakage
 *
 * Features:
 * - Sanitizes error messages for production
 * - Logs detailed errors for debugging
 * - Returns consistent error format
 * - Includes request ID for tracing
 * - Hides stack traces in production
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request['id'];

    // Determine status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Determine error message
    let message: string | object;
    let error: string;

    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'string') {
        message = responseBody;
        error = exception.name;
      } else if (typeof responseBody === 'object') {
        message = (responseBody as any).message || exception.message;
        error = (responseBody as any).error || exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    } else {
      message = 'Internal server error';
      error = 'InternalServerError';
    }

    // Determine if we should show detailed error
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    // Log the full error for debugging
    this.logger.error(
      {
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        status,
        error,
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
        userId: (request['user'] as any)?.id,
        ip: request.ip || request.socket.remoteAddress,
        userAgent: request.headers['user-agent'],
      },
      exception instanceof Error ? exception.stack : undefined
    );

    // Sanitize error message for production
    let sanitizedMessage = message;
    if (isProduction) {
      // Don't expose internal error details in production
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        sanitizedMessage = 'An internal server error occurred';
      } else if (typeof message === 'string') {
        // Remove stack traces and sensitive paths from message
        sanitizedMessage = message
          .replace(/\/[^\s]+\.(ts|js)/g, '[file]') // Remove file paths
          .replace(/at [^\s]+ \([^)]+\)/g, '') // Remove stack trace locations
          .trim();
      }
    }

    // Build error response
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: sanitizedMessage,
      error,
      requestId,
    };

    // Add debug information in development
    if (isDevelopment) {
      errorResponse.debug = {
        stack: exception instanceof Error ? exception.stack : undefined,
        originalMessage: message,
        exception:
          exception instanceof Error ? exception.toString() : String(exception),
      };
    }

    // Send response
    response.status(status).json(errorResponse);
  }
}
