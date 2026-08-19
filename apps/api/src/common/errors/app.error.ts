// Mirrors shared/errors/exceptions.py: a base AppError plus one subclass per HTTP failure mode
// domain services raise. Controllers never construct error responses directly — they let these
// propagate to HttpExceptionFilter.
export class AppError extends Error {
  readonly statusCode: number = 500;
  readonly errorCode: string = 'internal_error';

  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = new.target.name;
    if (errorCode) this.errorCode = errorCode;
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'not_found';
}

export class ValidationAppError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'validation_error';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'conflict';
}

export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'authentication_error';
}

export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = 'authorization_error';
}
