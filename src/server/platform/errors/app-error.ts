import { type ErrorCode, ERROR_CODES } from "./error-codes";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(params: {
    message: string;
    code?: ErrorCode;
    statusCode?: number;
    details?: unknown;
    isOperational?: boolean;
  }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code || ERROR_CODES.INTERNAL_ERROR;
    this.statusCode = params.statusCode || 500;
    this.details = params.details;
    this.isOperational = params.isOperational !== undefined ? params.isOperational : true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown, code: ErrorCode = ERROR_CODES.VALIDATION_ERROR) {
    return new AppError({ message, code, statusCode: 400, details });
  }

  static unauthorized(message = "Unauthorized", code: ErrorCode = ERROR_CODES.UNAUTHORIZED) {
    return new AppError({ message, code, statusCode: 401 });
  }

  static forbidden(message = "Forbidden", code: ErrorCode = ERROR_CODES.FORBIDDEN) {
    return new AppError({ message, code, statusCode: 403 });
  }

  static notFound(message = "Resource not found", code: ErrorCode = ERROR_CODES.NOT_FOUND) {
    return new AppError({ message, code, statusCode: 404 });
  }

  static conflict(message: string, code: ErrorCode = ERROR_CODES.CONFLICT) {
    return new AppError({ message, code, statusCode: 409 });
  }

  static rateLimited(message = "Too many requests", code: ErrorCode = ERROR_CODES.RATE_LIMITED) {
    return new AppError({ message, code, statusCode: 429 });
  }

  static internal(message = "An unexpected error occurred", details?: unknown) {
    return new AppError({ message, code: ERROR_CODES.INTERNAL_ERROR, statusCode: 500, details, isOperational: false });
  }
}
