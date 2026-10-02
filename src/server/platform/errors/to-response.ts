import "server-only";
import { NextResponse } from "next/server";
import { AppError } from "./app-error";
import { ERROR_CODES } from "./error-codes";
import { logger } from "../logger/logger";

export function toResponse(error: unknown, requestId?: string): NextResponse {
  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error({ err: error, requestId }, "Non-operational AppError");
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId,
        },
      },
      { status: error.statusCode }
    );
  }

  logger.error({ err: error, requestId }, "Unhandled internal error");

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "An internal server error occurred",
        requestId,
      },
    },
    { status: 500 }
  );
}
