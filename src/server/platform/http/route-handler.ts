import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getRequestId } from "../logger/request-context";
import { toResponse } from "../errors/to-response";
import { logger } from "../logger/logger";

export type HandlerFunction<T = unknown> = (
  req: NextRequest,
  context: { params: Record<string, string | string[]>; requestId: string }
) => Promise<NextResponse | T>;

export function createRouteHandler<T = unknown>(handler: HandlerFunction<T>) {
  return async (
    req: NextRequest,
    context?: { params?: Record<string, string | string[]> }
  ) => {
    const requestId = getRequestId(req);
    const start = Date.now();

    try {
      const result = await handler(req, {
        params: context?.params || {},
        requestId,
      });

      const durationMs = Date.now() - start;
      logger.info(
        {
          method: req.method,
          path: req.nextUrl.pathname,
          durationMs,
          requestId,
        },
        "Request completed"
      );

      if (result instanceof NextResponse) {
        result.headers.set("x-request-id", requestId);
        return result;
      }

      const response = NextResponse.json({
        success: true,
        data: result,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      });
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      const durationMs = Date.now() - start;
      logger.error(
        {
          method: req.method,
          path: req.nextUrl.pathname,
          durationMs,
          requestId,
          err: error,
        },
        "Request failed"
      );
      return toResponse(error, requestId);
    }
  };
}
