import { type NextRequest } from "next/server";
import crypto from "crypto";

export function getRequestId(req?: NextRequest): string {
  if (req) {
    const existing = req.headers.get("x-request-id");
    if (existing) return existing;
  }
  return crypto.randomUUID();
}
