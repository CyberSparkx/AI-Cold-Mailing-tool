import { describe, it, expect, beforeEach } from "vitest";
import { getAuthorizationUrl, GOOGLE_SCOPES } from "@/server/integrations/google/oauth";
import { env } from "@/server/platform/config/env";

describe("Google OAuth Scope & URL Generation", () => {
  beforeEach(() => {
    (env as any).GOOGLE_CLIENT_ID = "mock-client-id";
    (env as any).GOOGLE_CLIENT_SECRET = "mock-client-secret";
  });
  it("should have valid predefined Google API scopes", () => {
    expect(GOOGLE_SCOPES.GMAIL_SEND).toBe("https://www.googleapis.com/auth/gmail.send");
    expect(GOOGLE_SCOPES.GMAIL_READ).toBe("https://www.googleapis.com/auth/gmail.readonly");
    expect(GOOGLE_SCOPES.SHEETS).toBe("https://www.googleapis.com/auth/spreadsheets");
    expect(GOOGLE_SCOPES.USERINFO_EMAIL).toBe("https://www.googleapis.com/auth/userinfo.email");
  });

  it("should generate valid authorization URL for GMAIL_SEND", () => {
    const state = "test-state-123";
    const url = getAuthorizationUrl("GMAIL_SEND", state);

    expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url).toContain("access_type=offline");
    expect(url).toContain("prompt=consent");
    expect(url).toContain("include_granted_scopes=true");
    expect(url).toContain(encodeURIComponent(GOOGLE_SCOPES.GMAIL_SEND));
    expect(url).toContain(`state=${state}`);
  });

  it("should generate authorization URL for ALL services with all required scopes", () => {
    const state = "state-all-services";
    const url = getAuthorizationUrl("ALL", state);

    expect(url).toContain(encodeURIComponent(GOOGLE_SCOPES.GMAIL_SEND));
    expect(url).toContain(encodeURIComponent(GOOGLE_SCOPES.GMAIL_READ));
    expect(url).toContain(encodeURIComponent(GOOGLE_SCOPES.SHEETS));
    expect(url).toContain(encodeURIComponent(GOOGLE_SCOPES.USERINFO_EMAIL));
    expect(url).toContain("include_granted_scopes=true");
  });

  it("should generate authorization URL for SHEETS", () => {
    const state = "state-sheets";
    const url = getAuthorizationUrl("SHEETS", state);

    expect(url).toContain(encodeURIComponent(GOOGLE_SCOPES.SHEETS));
    expect(url).toContain(encodeURIComponent(GOOGLE_SCOPES.USERINFO_EMAIL));
  });
});
