import "server-only";
import { type NextRequest, type NextResponse } from "next/server";
import { requireUser, type AuthenticatedUser } from "../auth/session";
import { createRouteHandler, type HandlerFunction } from "./route-handler";

export type AuthenticatedHandlerFunction<T = unknown> = (
  req: NextRequest,
  context: {
    user: AuthenticatedUser;
    params: Record<string, string | string[]>;
    requestId: string;
  }
) => Promise<NextResponse | T>;

export function createAuthenticatedHandler<T = unknown>(
  handler: AuthenticatedHandlerFunction<T>
) {
  return createRouteHandler(async (req, context) => {
    const user = await requireUser();
    return handler(req, {
      ...context,
      user,
    });
  });
}
