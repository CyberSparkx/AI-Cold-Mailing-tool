import { describe, it, expect } from "vitest";
import { generateUnsubscribeToken, verifyUnsubscribeToken } from "@/server/platform/crypto/tokens";

describe("HMAC Unsubscribe Token Security", () => {
  const payload = {
    userId: "650000000000000000000001",
    email: "lead@targetcompany.com",
    campaignId: "650000000000000000000002",
  };

  it("should generate and verify a valid HMAC signed unsubscribe token", () => {
    const token = generateUnsubscribeToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.includes(".")).toBe(true);

    const verified = verifyUnsubscribeToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.campaignId).toBe(payload.campaignId);
    expect(verified?.timestamp).toBeGreaterThan(0);
  });

  it("should reject tampered payload data", () => {
    const token = generateUnsubscribeToken(payload);
    const [encodedData, signature] = token.split(".");

    // Decode, tamper with email, re-encode without signature update
    const decoded = JSON.parse(Buffer.from(encodedData, "base64url").toString("utf8"));
    decoded.email = "attacker@evil.com";
    const tamperedData = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    const tamperedToken = `${tamperedData}.${signature}`;
    const verified = verifyUnsubscribeToken(tamperedToken);

    expect(verified).toBeNull();
  });

  it("should reject invalid or malformed tokens", () => {
    expect(verifyUnsubscribeToken("invalid_token")).toBeNull();
    expect(verifyUnsubscribeToken("")).toBeNull();
    expect(verifyUnsubscribeToken("abc.def.ghi")).toBeNull();
  });
});
