import "server-only";
import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth.config";
import { AppError } from "../errors/app-error";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * React cache() deduplicates calls within a single server render pass.
 * Layout + Page + multiple Server Components can all call getCurrentUser()
 * and it only resolves getServerSession() ONCE per request — zero extra cost.
 */
const getSessionCached = cache(async () => {
  return getServerSession(authOptions);
});

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getSessionCached();

  if (!session?.user?.id || !session?.user?.email) {
    // Development fallback — only when DEV_MOCK_USER is explicitly set
    if (
      process.env.NODE_ENV === "development" &&
      process.env.DEV_MOCK_USER === "true"
    ) {
      return {
        id: "660000000000000000000001",
        email: "developer@example.com",
        name: "Developer",
      };
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw AppError.unauthorized("Authentication required to access this resource");
  }
  return user;
}
