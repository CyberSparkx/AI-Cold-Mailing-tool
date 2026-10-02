import { google } from "googleapis";
import { env } from "@/server/platform/config/env";
import { AppError } from "@/server/platform/errors/app-error";

export const GOOGLE_SCOPES = {
  GMAIL_SEND: "https://www.googleapis.com/auth/gmail.send",
  GMAIL_READ: "https://www.googleapis.com/auth/gmail.readonly",
  SHEETS: "https://www.googleapis.com/auth/spreadsheets",
  USERINFO_EMAIL: "https://www.googleapis.com/auth/userinfo.email",
} as const;

export function getOAuth2Client() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw AppError.badRequest("Google OAuth credentials are not configured in environment");
  }

  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_OAUTH_REDIRECT_URI
  );
}

export function getAuthorizationUrl(service: "SHEETS" | "GMAIL_SEND" | "GMAIL_READ" | "ALL", state: string) {
  const oauth2Client = getOAuth2Client();

  const scopes: string[] = [GOOGLE_SCOPES.USERINFO_EMAIL];
  if (service === "SHEETS") {
    scopes.push(GOOGLE_SCOPES.SHEETS);
  } else if (service === "GMAIL_SEND") {
    scopes.push(GOOGLE_SCOPES.GMAIL_SEND);
  } else if (service === "GMAIL_READ") {
    scopes.push(GOOGLE_SCOPES.GMAIL_READ);
  } else if (service === "ALL") {
    scopes.push(GOOGLE_SCOPES.SHEETS, GOOGLE_SCOPES.GMAIL_SEND, GOOGLE_SCOPES.GMAIL_READ);
  }

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "consent", // ensure refresh token is returned
    include_granted_scopes: true,
  });
}

