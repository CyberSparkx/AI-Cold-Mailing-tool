import "server-only";
import crypto from "crypto";
import { env } from "../config/env";

export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export interface UnsubscribePayload {
  userId: string;
  email: string;
  campaignId?: string;
  timestamp: number;
}

export function generateUnsubscribeToken(payload: {
  userId: string;
  email: string;
  campaignId?: string;
}): string {
  const secret = env.UNSUBSCRIBE_SIGNING_KEY || "default_unsubscribe_signing_secret_key";
  const data = JSON.stringify({
    userId: payload.userId,
    email: payload.email.toLowerCase().trim(),
    campaignId: payload.campaignId,
    timestamp: Date.now(),
  });

  const hmac = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  const encodedData = Buffer.from(data).toString("base64url");
  return `${encodedData}.${hmac}`;
}

export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [encodedData, signature] = parts;
    const secret = env.UNSUBSCRIBE_SIGNING_KEY || "default_unsubscribe_signing_secret_key";
    const data = Buffer.from(encodedData, "base64url").toString("utf8");

    const expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(data) as UnsubscribePayload;
    return payload;
  } catch {
    return null;
  }
}
