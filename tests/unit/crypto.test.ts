import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "@/server/platform/crypto/encrypt";
import { AppError } from "@/server/platform/errors/app-error";

describe("AES-256-GCM Token Encryption", () => {
  it("should encrypt and decrypt plaintext successfully", () => {
    const secret = "ya29.a0ARrdaM-sensitive-oauth-refresh-token-12345";
    const encrypted = encrypt(secret);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(secret);
    expect(encrypted.split(":").length).toBe(3); // iv:tag:ciphertext

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(secret);
  });

  it("should return empty string when input is empty", () => {
    expect(encrypt("")).toBe("");
    expect(decrypt("")).toBe("");
  });

  it("should generate unique ciphertexts for identical plaintext due to random IVs", () => {
    const secret = "static_same_secret_token";
    const enc1 = encrypt(secret);
    const enc2 = encrypt(secret);

    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(secret);
    expect(decrypt(enc2)).toBe(secret);
  });

  it("should fail decryption when auth tag is tampered", () => {
    const secret = "confidential-google-token";
    const encrypted = encrypt(secret);
    const parts = encrypted.split(":");
    // Tamper with the auth tag
    const tamperedTag = Buffer.from("corruptedauth16b").toString("base64");
    const tampered = `${parts[0]}:${tamperedTag}:${parts[2]}`;

    expect(() => decrypt(tampered)).toThrowError(AppError);
  });

  it("should fail decryption when payload format is invalid", () => {
    expect(() => decrypt("not-a-valid-encrypted-string")).toThrowError(AppError);
  });
});
