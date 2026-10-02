import "server-only";
import { LeadSourceProvider, LeadSearchParams, LeadSearchResult, RawLead } from "./provider.interface";
import { env } from "@/server/platform/config/env";
import { LIMITS } from "@/server/platform/config/limits";
import { logger } from "@/server/platform/logger/logger";

export class GooglePlacesProvider implements LeadSourceProvider {
  readonly key = "google_places";
  readonly name = "Google Places API (New)";
  readonly requiresApiKey = true;

  isConfigured(): boolean {
    return Boolean(env.GOOGLE_PLACES_API_KEY);
  }

  async search(params: LeadSearchParams): Promise<LeadSearchResult> {
    if (!this.isConfigured()) {
      throw new Error("Google Places API key is not configured");
    }

    const { category, city, country = "", maxResults = 20 } = params;
    const textQuery = `${category} in ${city} ${country}`.trim();

    try {
      // Use Google Places API (New) textSearch with strict FieldMask to control costs
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
          // FieldMask limits: only retrieve basic identity and contact fields
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount",
        },
        body: JSON.stringify({
          textQuery,
          pageSize: Math.min(maxResults, LIMITS.LEADS_MAX_RESULTS_PER_SEARCH),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error({ status: response.status, errText }, "Google Places API failed");
        throw new Error(`Google Places API returned ${response.status}`);
      }

      const data = await response.json();
      const places = data.places || [];

      const leads: RawLead[] = places.map((place: any) => ({
        businessName: place.displayName?.text || "Unknown Business",
        category,
        niche: params.niche,
        website: place.websiteUri,
        phone: place.nationalPhoneNumber,
        address: place.formattedAddress,
        city,
        country,
        rating: place.rating,
        reviewCount: place.userRatingCount,
        source: this.key,
        externalId: place.id,
      }));

      return {
        leads,
        totalFound: leads.length,
        provider: this.key,
        estimatedCostUnits: 1,
      };
    } catch (err) {
      logger.error({ err }, "Google Places Provider exception");
      throw err;
    }
  }
}
