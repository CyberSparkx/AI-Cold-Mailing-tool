
export interface RawLead {
  businessName: string;
  category?: string;
  niche?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  source: string;
  sourceUrl?: string;
  externalId?: string;
}

export interface LeadSearchParams {
  category: string;
  niche?: string;
  city: string;
  country?: string;
  radiusKm?: number;
  maxResults?: number;
}

export interface LeadSearchResult {
  leads: RawLead[];
  totalFound: number;
  provider: string;
  estimatedCostUnits?: number;
}

export interface LeadSourceProvider {
  readonly key: string;
  readonly name: string;
  readonly requiresApiKey: boolean;

  isConfigured(): boolean;
  search(params: LeadSearchParams): Promise<LeadSearchResult>;
}
