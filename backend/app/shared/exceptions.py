from typing import Any, Optional
from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception with standardized code and details."""
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: str = "BAD_REQUEST",
        message: str = "Yêu cầu không hợp lệ",
        details: Optional[Any] = None,
    ):
        super().__init__(status_code=status_code, detail={"code": code, "message": message, "details": details})
        self.code = code
        self.message = message
        self.details = details


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Chưa xác thực hoặc token không hợp lệ", code: str = "UNAUTHORIZED"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=code,
            message=message,
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "Bạn không có quyền thực hiện hành động này", code: str = "FORBIDDEN"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code=code,
            message=message,
        )


class NotFoundException(AppException):
    def __init__(self, message: str = "Không tìm thấy tài nguyên yêu cầu", code: str = "NOT_FOUND"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code=code,
            message=message,
        )


class ConflictException(AppException):
    def __init__(self, message: str = "Xung đột trạng thái dữ liệu", code: str = "CONFLICT"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code=code,
            message=message,
        )


class ValidationException(AppException):
    def __init__(self, message: str = "Dữ liệu đầu vào không hợp lệ", details: Optional[Any] = None):
        super().__init__(
            status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
            code="UNPROCESSABLE_ENTITY",
            message=message,
            details=details,
        )
