import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/platform/auth/session";
import { getAuthorizationUrl } from "@/server/integrations/google/oauth";

// GET /api/google/connect?service=SHEETS | GMAIL_SEND | GMAIL_READ
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const serviceParam = req.nextUrl.searchParams.get("service") || "SHEETS";
    const service = serviceParam as "SHEETS" | "GMAIL_SEND" | "GMAIL_READ";

    const state = JSON.stringify({
      userId: user.id,
      service,
      timestamp: Date.now(),
    });

    const url = getAuthorizationUrl(service, Buffer.from(state).toString("base64url"));
    return NextResponse.redirect(url);
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings/google?error=${encodeURIComponent(err.message || "Failed to start Google connection")}`, req.url)
    );
  }
}
