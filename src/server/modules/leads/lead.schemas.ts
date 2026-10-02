import { z } from "zod";

export const searchLeadsSchema = z.object({
  provider: z.string().default("osm"),
  category: z.string().min(2, "Category is required"),
  niche: z.string().optional(),
  city: z.string().min(2, "City is required"),
  country: z.string().optional().default("India"),
  maxResults: z.coerce.number().min(1).max(100).default(20),
});

export type SearchLeadsInput = z.infer<typeof searchLeadsSchema>;

export const rawLeadSchema = z.object({
  businessName: z.string().min(1),
  category: z.string().optional(),
  niche: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  source: z.string(),
  sourceUrl: z.string().optional(),
  externalId: z.string().optional(),
});

export const saveLeadsSchema = z.object({
  leads: z.array(rawLeadSchema).min(1, "At least one lead is required to save"),
});

export type SaveLeadsInput = z.infer<typeof saveLeadsSchema>;

export const listLeadsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  status: z.string().optional(),
  emailStatus: z.string().optional(),
});

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;

export const updateLeadSchema = z.object({
  businessName: z.string().min(1).optional(),
  category: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "REPLIED", "QUALIFIED", "DISQUALIFIED", "DO_NOT_CONTACT"]).optional(),
  emailStatus: z.enum(["NOT_SENT", "QUEUED", "SENDING", "SENT", "FAILED", "REPLIED", "UNSUBSCRIBED", "BOUNCED", "SKIPPED"]).optional(),
  notes: z.string().optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
