import { createAuthenticatedHandler } from "@/server/platform/http/with-auth";
import { validateBody } from "@/server/platform/http/with-validation";
import { aiUsageService } from "@/server/integrations/ai/usage";
import { classifyEmailWithAi } from "@/server/integrations/ai/chains/emailClassifier";
import { personalizeLeadWithAi } from "@/server/integrations/ai/chains/emailPersonalizer";
import { z } from "zod";

// GET /api/settings/ai - Return token usage and monthly spend
export const GET = createAuthenticatedHandler(async (_req, { user }) => {
  return aiUsageService.getMonthlySummary(user.id);
});

const testAiSchema = z.object({
  action: z.enum(["CLASSIFY", "PERSONALIZE"]),
  sampleInput: z.string(),
});

// POST /api/settings/ai - Test AI prompt chains
export const POST = createAuthenticatedHandler(async (req, { user }) => {
  const body = await validateBody(req, testAiSchema);

  if (body.action === "CLASSIFY") {
    const result = await classifyEmailWithAi({
      userId: user.id,
      sender: "Test Sender <client@example.com>",
      subject: "Inquiry about custom web portal development",
      snippet: body.sampleInput,
    });
    return result;
  } else {
    const result = await personalizeLeadWithAi({
      userId: user.id,
      businessName: body.sampleInput || "Vertex Media",
      category: "Creative Agency",
      location: "Bangalore",
    });
    return result;
  }
});
