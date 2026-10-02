import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware — runs before every request.
 * Uses getToken() which reads the JWT directly from the cookie
 * (no database round-trip, sub-millisecond cost).
 */
export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // ── Protected zone: /dashboard/** ──────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", encodeURIComponent(pathname));
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Auth pages: redirect already-authenticated users to dashboard ──────────
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard/overview", request.url));
  }

  // ── Root: redirect to dashboard if logged in, else marketing/login ─────────
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/dashboard/overview", request.url));
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Run middleware on all paths EXCEPT:
   * - Next.js internals (_next/*)
   * - Static assets (images, fonts, icons)
   * - NextAuth API routes (must stay open)
   * - Service worker
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/auth|sw\\.js|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|eot)).*)",
  ],
};
