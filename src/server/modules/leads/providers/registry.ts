import { LeadSourceProvider } from "./provider.interface";
import { OsmProvider } from "./osm.provider";
import { CsvProvider } from "./csv.provider";
import { GooglePlacesProvider } from "./places.provider";
import { AppError } from "@/server/platform/errors/app-error";

export class ProviderRegistry {
  private providers: Map<string, LeadSourceProvider> = new Map();

  constructor() {
    this.register(new OsmProvider());
    this.register(new CsvProvider());
    this.register(new GooglePlacesProvider());
  }

  register(provider: LeadSourceProvider) {
    this.providers.set(provider.key, provider);
  }

  get(key: string): LeadSourceProvider {
    const provider = this.providers.get(key);
    if (!provider) {
      throw AppError.badRequest(`Unknown lead provider: ${key}`);
    }
    return provider;
  }

  listAvailable(): { key: string; name: string; isConfigured: boolean; requiresApiKey: boolean }[] {
    return Array.from(this.providers.values()).map((p) => ({
      key: p.key,
      name: p.name,
      isConfigured: p.isConfigured(),
      requiresApiKey: p.requiresApiKey,
    }));
  }
}

export const providerRegistry = new ProviderRegistry();
