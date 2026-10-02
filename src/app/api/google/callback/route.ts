import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/server/integrations/google/oauth";
import { storeGoogleTokens } from "@/server/integrations/google/token-store";
import { GoogleService } from "@prisma/client";
import { logger } from "@/server/platform/logger/logger";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateB64 = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code || !stateB64) {
    logger.warn({ error }, "Google OAuth callback error or missing code");
    return NextResponse.redirect(
      new URL(`/dashboard/settings/google?error=${encodeURIComponent(error || "Authorization cancelled")}`, req.url)
    );
  }

  try {
    const stateStr = Buffer.from(stateB64, "base64url").toString("utf8");
    const state = JSON.parse(stateStr);
    const { userId, service } = state;

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("No access token returned from Google");
    }

    oauth2Client.setCredentials(tokens);

    // Fetch user email for this Google account
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email || "unknown@gmail.com";
    const providerAccountId = userInfo.data.id || email;

    const grantedScopes = tokens.scope ? tokens.scope.split(" ") : [];

    await storeGoogleTokens({
      userId,
      providerAccountId,
      email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
      scopes: grantedScopes,
      service: (service === "ALL" ? GoogleService.GMAIL_SEND : service) as GoogleService,
    });

    logger.info({ userId, email, service }, "Google account successfully linked");

    return NextResponse.redirect(
      new URL(`/dashboard/settings/google?success=${encodeURIComponent(`Connected ${service} successfully`)}`, req.url)
    );
  } catch (err: any) {
    logger.error({ err }, "Google OAuth exchange error");
    return NextResponse.redirect(
      new URL(`/dashboard/settings/google?error=${encodeURIComponent(err.message || "Failed to exchange tokens")}`, req.url)
    );
  }
}
