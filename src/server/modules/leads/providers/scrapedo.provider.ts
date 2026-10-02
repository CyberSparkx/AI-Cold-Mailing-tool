import { LeadSourceProvider, LeadSearchParams, LeadSearchResult, RawLead } from "./provider.interface";
import { env } from "@/server/platform/config/env";
import { LIMITS } from "@/server/platform/config/limits";
import { logger } from "@/server/platform/logger/logger";
import { AppError } from "@/server/platform/errors/app-error";

export class ScrapeDoProvider implements LeadSourceProvider {
  readonly key = "scrape_do";
  readonly name = "Google Maps (via Scrape.do)";
  readonly requiresApiKey = true;

  isConfigured(): boolean {
    return Boolean(env.SCRAPE_DO_API_KEY);
  }

  async search(params: LeadSearchParams): Promise<LeadSearchResult> {
    if (!this.isConfigured()) {
      throw AppError.badRequest(
        "Scrape.do API token is not configured. Please add SCRAPE_DO_API_KEY to your environment (.env.local)."
      );
    }

    const { category, city, country = "", maxResults = 20 } = params;
    const query = `${category} in ${city} ${country}`.trim();
    const token = env.SCRAPE_DO_API_KEY;

    try {
      logger.info({ query, provider: this.key }, "Dispatching Google Maps search via Scrape.do");

      // Use Scrape.do Google Maps Search plugin endpoint
      const targetUrl = `https://api.scrape.do/plugin/google/maps/search?token=${encodeURIComponent(
        token
      )}&q=${encodeURIComponent(query)}`;

      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": env.SITE_FETCH_USER_AGENT,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, errorText }, "Scrape.do Google Maps request failed");
        throw AppError.badRequest(`Scrape.do API returned HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const results: any[] = data.local_results || data.places || [];

      logger.info(
        { count: results.length, query },
        "Scrape.do returned Google Maps places"
      );

      const maxLimit = Math.min(maxResults, LIMITS.LEADS_MAX_RESULTS_PER_SEARCH, results.length);
      const leads: RawLead[] = [];

      for (let i = 0; i < maxLimit; i++) {
        const item = results[i];
        const businessName = item.title || item.name || "Unknown Business";
        const website = item.website || undefined;
        const phone = item.phone || undefined;
        const address = item.address || undefined;
        const rating = typeof item.rating === "number" ? item.rating : undefined;
        const reviewCount =
          typeof item.reviews === "number"
            ? item.reviews
            : typeof item.user_rating_count === "number"
            ? item.user_rating_count
            : undefined;

        leads.push({
          businessName,
          category,
          niche: params.niche,
          website: website ? (website.startsWith("http") ? website : `https://${website}`) : undefined,
          phone,
          address,
          city,
          country,
          rating,
          reviewCount,
          source: this.key,
          externalId: item.place_id || item.data_id || `scrapedo-${i}`,
        });
      }

      // Fast email enrichment for leads that have a website (parallel with 3.5s timeout)
      await Promise.all(
        leads.map(async (lead) => {
          if (!lead.website || lead.email) return;
          try {
            const email = await this.quickScrapeWebsiteEmail(lead.website);
            if (email) {
              lead.email = email;
            }
          } catch {
            // Ignore website scrape failures gracefully
          }
        })
      );

      return {
        leads,
        totalFound: leads.length,
        provider: this.key,
        estimatedCostUnits: 1,
      };
    } catch (err: any) {
      logger.error({ err: err.message, query }, "Scrape.do provider exception");
      throw err;
    }
  }

  /**
   * Fast, lightweight email discovery on the company website homepage
   */
  private async quickScrapeWebsiteEmail(websiteUrl: string): Promise<string | undefined> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(websiteUrl, {
        headers: {
          "User-Agent": env.SITE_FETCH_USER_AGENT,
          "Accept": "text/html",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (!res.ok) return undefined;

      const html = await res.text();

      // Look for mailto: links first
      const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (mailtoMatch && mailtoMatch[1]) {
        return mailtoMatch[1].toLowerCase().trim();
      }

      // Look for plain email regex in HTML
      const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatches && emailMatches.length > 0) {
        // Filter out image file extensions or fake matches (.png, .jpg, .svg, .webp)
        const valid = emailMatches.find((e) => !/\.(png|jpg|jpeg|svg|webp|gif)$/i.test(e));
        if (valid) {
          return valid.toLowerCase().trim();
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
