import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScrapeDoProvider } from "@/server/modules/leads/providers/scrapedo.provider";
import { env } from "@/server/platform/config/env";
import { AppError } from "@/server/platform/errors/app-error";

describe("ScrapeDoProvider Lead Discovery", () => {
  let provider: ScrapeDoProvider;

  beforeEach(() => {
    provider = new ScrapeDoProvider();
    vi.restoreAllMocks();
  });

  it("should have correct metadata and require API key", () => {
    expect(provider.key).toBe("scrape_do");
    expect(provider.name).toContain("Scrape.do");
    expect(provider.requiresApiKey).toBe(true);
  });

  it("should report configured only when SCRAPE_DO_API_KEY is present", () => {
    (env as any).SCRAPE_DO_API_KEY = "";
    expect(provider.isConfigured()).toBe(false);

    (env as any).SCRAPE_DO_API_KEY = "test-scrape-do-token";
    expect(provider.isConfigured()).toBe(true);
  });

  it("should throw AppError when search is invoked without token", async () => {
    (env as any).SCRAPE_DO_API_KEY = "";
    await expect(
      provider.search({ category: "Dental", city: "Bangalore" })
    ).rejects.toThrowError(AppError);
  });

  it("should query Scrape.do Google Maps endpoint and map places to leads", async () => {
    (env as any).SCRAPE_DO_API_KEY = "mock_scrape_do_token";

    const mockResponse = {
      local_results: [
        {
          title: "Bangalore Smiles Dental Clinic",
          address: "100 Feet Rd, Indiranagar, Bangalore",
          phone: "+91 80 1234 5678",
          website: "https://bangaloresmiles.example.com",
          rating: 4.9,
          reviews: 142,
          place_id: "ChIJ1234567890",
        },
        {
          name: "Apex Healthcare Center",
          address: "Koramangala 4th Block, Bangalore",
          phone: "+91 80 9876 5432",
          rating: 4.7,
          reviews: 89,
          place_id: "ChIJ0987654321",
        },
      ],
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("api.scrape.do/plugin/google/maps/search")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        text: () => Promise.resolve(""),
      } as Response);
    });

    const result = await provider.search({
      category: "Dental",
      niche: "Cosmetic",
      city: "Bangalore",
      country: "India",
      maxResults: 10,
    });

    expect(result.provider).toBe("scrape_do");
    expect(result.totalFound).toBe(2);
    expect(result.leads.length).toBe(2);

    const first = result.leads[0];
    expect(first.businessName).toBe("Bangalore Smiles Dental Clinic");
    expect(first.website).toBe("https://bangaloresmiles.example.com");
    expect(first.phone).toBe("+91 80 1234 5678");
    expect(first.rating).toBe(4.9);
    expect(first.reviewCount).toBe(142);
    expect(first.category).toBe("Dental");
    expect(first.niche).toBe("Cosmetic");
    expect(first.city).toBe("Bangalore");

    const second = result.leads[1];
    expect(second.businessName).toBe("Apex Healthcare Center");
    expect(second.rating).toBe(4.7);
    expect(second.reviewCount).toBe(89);
  });
});
