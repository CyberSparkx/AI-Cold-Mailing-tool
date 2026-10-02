import "server-only";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth.config";
import { AppError } from "../errors/app-error";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.email) {
    // For development convenience when offline without OAuth client setup, support a fallback dev user
    if (process.env.NODE_ENV === "development" && process.env.DEV_MOCK_USER === "true") {
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
