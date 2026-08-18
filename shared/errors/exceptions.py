class AppError(Exception):
    """Base class for domain/service errors that map to a stable HTTP response.

    Routers never construct HTTPException directly for domain failures — services raise
    one of these, and the global handler (shared/errors/handlers.py) turns it into a
    structured error response with a correlation ID (blueprint §5 API standards).
    """

    status_code: int = 500
    error_code: str = "internal_error"

    def __init__(self, message: str, *, error_code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if error_code:
            self.error_code = error_code


class NotFoundError(AppError):
    status_code = 404
    error_code = "not_found"


class ValidationAppError(AppError):
    status_code = 422
    error_code = "validation_error"


class ConflictError(AppError):
    status_code = 409
    error_code = "conflict"


class AuthenticationError(AppError):
    status_code = 401
    error_code = "authentication_error"


class AuthorizationError(AppError):
    status_code = 403
    error_code = "authorization_error"
