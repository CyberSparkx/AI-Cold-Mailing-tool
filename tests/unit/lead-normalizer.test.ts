import { describe, it, expect } from "vitest";
import {
  extractDomainFromUrl,
  normalizePhoneNumber,
  normalizeLead,
} from "@/server/modules/leads/lead.normalizer";

describe("Lead Normalization & Deduplication Keys", () => {
  describe("extractDomainFromUrl", () => {
    it("should strip protocols, www prefixes, and paths", () => {
      expect(extractDomainFromUrl("https://www.example.com/about?ref=1")).toBe("example.com");
      expect(extractDomainFromUrl("http://dentalstudio.co.uk/services")).toBe("dentalstudio.co.uk");
      expect(extractDomainFromUrl("mycompany.org/")).toBe("mycompany.org");
    });

    it("should return undefined for invalid or empty urls", () => {
      expect(extractDomainFromUrl("")).toBeUndefined();
      expect(extractDomainFromUrl(undefined)).toBeUndefined();
      expect(extractDomainFromUrl("not a url @@")).toBeUndefined();
    });
  });

  describe("normalizePhoneNumber", () => {
    it("should strip non-digits except leading plus", () => {
      expect(normalizePhoneNumber("+1 (555) 234-5678")).toBe("+15552345678");
      expect(normalizePhoneNumber("  020 7946 0991 ")).toBe("02079460991");
    });

    it("should reject numbers with fewer than 7 digits", () => {
      expect(normalizePhoneNumber("12345")).toBeUndefined();
      expect(normalizePhoneNumber("")).toBeUndefined();
      expect(normalizePhoneNumber(undefined)).toBeUndefined();
    });
  });

  describe("normalizeLead", () => {
    it("should prioritize domain for dedupeKey", () => {
      const normalized = normalizeLead({
        source: "test",
        businessName: "Acme Corp",
        website: "https://www.acmecorp.com/index",
        email: "Hello@AcmeCorp.com",
        phone: "+1 555-123-4567",
        city: "Seattle",
      });

      expect(normalized.websiteDomain).toBe("acmecorp.com");
      expect(normalized.emailNormalized).toBe("hello@acmecorp.com");
      expect(normalized.dedupeKey).toBe("dom:acmecorp.com");
    });

    it("should fallback to email if domain is absent", () => {
      const normalized = normalizeLead({
        source: "test",
        businessName: "Acme Corp",
        email: "Contact@AcmeCorp.com",
        city: "Austin",
      });

      expect(normalized.dedupeKey).toBe("em:contact@acmecorp.com");
    });

    it("should fallback to phone if domain and email are absent", () => {
      const normalized = normalizeLead({
        source: "test",
        businessName: "Acme Corp",
        phone: "+1 555-987-6543",
        city: "Miami",
      });

      expect(normalized.dedupeKey).toBe("ph:+15559876543");
    });

    it("should fallback to geo name hash if no contacts exist", () => {
      const normalized = normalizeLead({
        source: "test",
        businessName: "Joe's Coffee & Bakery!",
        city: "San Francisco",
      });

      expect(normalized.dedupeKey).toBe("geo:joescoffeebakery_sanfrancisco");
    });
  });
});
