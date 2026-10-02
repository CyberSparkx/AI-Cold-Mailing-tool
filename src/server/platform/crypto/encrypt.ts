import "server-only";
import crypto from "crypto";
import { env } from "../config/env";
import { AppError } from "../errors/app-error";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getKey(): Buffer {
  const keyBase64 = env.TOKEN_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not configured");
  }
  const keyBuffer = Buffer.from(keyBase64, "base64");
  if (keyBuffer.length !== 32) {
    // If not 32 bytes, derive via SHA-256
    return crypto.createHash("sha256").update(keyBase64).digest();
  }
  return keyBuffer;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  version: number;
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const tag = cipher.getAuthTag();

    // Format: iv:tag:ciphertext
    return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
  } catch (error) {
    throw AppError.internal("Failed to encrypt sensitive data", error);
  }
}

export function decrypt(encryptedPayload: string): string {
  if (!encryptedPayload) return "";
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted payload format");
    }

    const [ivB64, tagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertextB64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    throw AppError.internal("Failed to decrypt sensitive data", error);
  }
}
