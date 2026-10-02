import { z } from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(2, "Campaign name is required"),
  subjectTemplate: z.string().min(3, "Subject template is required"),
  bodyTemplate: z.string().min(10, "Email body template is required"),
  dailyLimit: z.coerce.number().min(1).max(100).default(25),
  sendWindowStart: z.coerce.number().min(0).max(23).default(9),
  sendWindowEnd: z.coerce.number().min(0).max(23).default(17),
  useAiPersonalization: z.boolean().default(false),
  isFollowUp: z.boolean().default(false),
  // Recipient source
  sourceType: z.enum(["LEADS", "CSV", "MANUAL"]).default("LEADS"),
  leadIds: z.array(z.string()).optional(),
  manualRecipients: z
    .array(
      z.object({
        businessName: z.string().min(1),
        email: z.string().email(),
        category: z.string().optional(),
        location: z.string().optional(),
        website: z.string().optional(),
      })
    )
    .optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const campaignActionSchema = z.object({
  action: z.enum(["START", "PAUSE", "RESUME", "CANCEL"]),
  confirm: z.boolean().optional(),
});

export type CampaignActionInput = z.infer<typeof campaignActionSchema>;

export const suppressionEntrySchema = z.object({
  email: z.string().optional(),
  domain: z.string().optional(),
  reason: z.enum(["UNSUBSCRIBED", "BOUNCED", "MANUAL", "COMPLAINT", "REPLIED_NEGATIVE"]).default("MANUAL"),
  note: z.string().optional(),
});

export type SuppressionEntryInput = z.infer<typeof suppressionEntrySchema>;
