import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { getRequestId } from '../request-context';
import { AppError } from './app.error';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    request_id: string | null;
  };
}

function errorBody(code: string, message: string): ErrorBody {
  return { error: { code, message, request_id: getRequestId() } };
}

// Three handler branches: AppError subclasses → their own status/code, class-validator DTO
// failures (Nest's BadRequestException from ValidationPipe) → 422 validation_error, and a
// catch-all → 500 internal_error (always logged).
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof AppError) {
      if (exception.statusCode >= 500) {
        this.logger.error(exception.message, exception.stack);
      }
      response.status(exception.statusCode).json(errorBody(exception.errorCode, exception.message));
      return;
    }

    // NestJS framework exceptions (NotFoundException for unmatched routes,
    // ForbiddenException from guards, etc.) — pass their status through directly.
    if (exception instanceof HttpException && !(exception instanceof BadRequestException)) {
      const status = exception.getStatus();
      if (status >= 500) this.logger.error(exception.message, exception.stack);
      response.status(status).json(errorBody('http_error', exception.message));
      return;
    }

    if (exception instanceof BadRequestException) {
      const payload = exception.getResponse();
      const message =
        typeof payload === 'string'
          ? payload
          : JSON.stringify((payload as { message?: unknown }).message ?? payload);
      response.status(422).json(errorBody('validation_error', message));
      return;
    }

    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(err.message, err.stack);
    response.status(500).json(errorBody('internal_error', 'An unexpected error occurred.'));
  }
}
