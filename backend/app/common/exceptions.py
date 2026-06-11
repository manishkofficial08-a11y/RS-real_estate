"""Common application exceptions."""
from typing import Any, Optional


class AppException(Exception):
    """Base application exception."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(AppException):
    """Validation error exception."""
    
    def __init__(
        self,
        message: str = "Validation error",
        error_code: str = "VALIDATION_ERROR",
        details: Optional[dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=422,
            error_code=error_code,
            details=details,
        )


class AuthenticationException(AppException):
    """Authentication error exception."""
    
    def __init__(
        self,
        message: str = "Authentication failed",
        error_code: str = "AUTHENTICATION_ERROR",
    ):
        super().__init__(
            message=message,
            status_code=401,
            error_code=error_code,
        )


class AuthorizationException(AppException):
    """Authorization error exception."""
    
    def __init__(
        self,
        message: str = "Access denied",
        error_code: str = "AUTHORIZATION_ERROR",
    ):
        super().__init__(
            message=message,
            status_code=403,
            error_code=error_code,
        )


class ResourceNotFoundException(AppException):
    """Resource not found exception."""
    
    def __init__(
        self,
        message: str = "Resource not found",
        error_code: str = "NOT_FOUND",
    ):
        super().__init__(
            message=message,
            status_code=404,
            error_code=error_code,
        )


class ConflictException(AppException):
    """Conflict exception (e.g., duplicate resource)."""
    
    def __init__(
        self,
        message: str = "Resource already exists",
        error_code: str = "CONFLICT",
    ):
        super().__init__(
            message=message,
            status_code=409,
            error_code=error_code,
        )


class RateLimitException(AppException):
    """Rate limit exceeded exception."""
    
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        error_code: str = "RATE_LIMIT_EXCEEDED",
        retry_after: Optional[int] = None,
    ):
        super().__init__(
            message=message,
            status_code=429,
            error_code=error_code,
            details={"retry_after": retry_after} if retry_after else {},
        )


class DatabaseException(AppException):
    """Database error exception."""
    
    def __init__(
        self,
        message: str = "Database error",
        error_code: str = "DATABASE_ERROR",
    ):
        super().__init__(
            message=message,
            status_code=500,
            error_code=error_code,
        )
