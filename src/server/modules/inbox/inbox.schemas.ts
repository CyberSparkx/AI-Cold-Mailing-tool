import { z } from "zod";

export const listInboxQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  category: z.string().optional(),
  opportunityStatus: z.string().optional(),
  onlyOpportunities: z.coerce.boolean().optional(),
});

export type ListInboxQuery = z.infer<typeof listInboxQuerySchema>;

export const updateInboxMessageSchema = z.object({
  opportunityStatus: z.enum(["NEW", "REVIEWED", "REPLIED", "DISMISSED"]).optional(),
  userOverrideCategory: z
    .enum([
      "WEBSITE_INQUIRY",
      "SOFTWARE_INQUIRY",
      "FREELANCE_OPPORTUNITY",
      "JOB_OPPORTUNITY",
      "PARTNERSHIP",
      "GENERAL",
      "NOT_RELEVANT",
    ])
    .optional(),
});

export type UpdateInboxMessageInput = z.infer<typeof updateInboxMessageSchema>;
