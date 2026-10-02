import "server-only";
import { getGeminiModel } from "../gemini";
import { aiCache } from "../cache";
import { aiUsageService } from "../usage";
import {
  LEAD_PERSONALIZATION_SYSTEM_PROMPT,
  personalizationOutputSchema,
  PersonalizationOutput,
} from "../prompts/leadPersonalization";
import { env } from "@/server/platform/config/env";
import { logger } from "@/server/platform/logger/logger";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function personalizeLeadWithAi(params: {
  userId: string;
  businessName: string;
  category?: string;
  location?: string;
  website?: string;
}): Promise<PersonalizationOutput> {
  const { userId, businessName, category, location, website } = params;

  // 1. Budget guard
  const budget = await aiUsageService.checkCanSpendTokens(userId);
  if (!budget.canSpend) {
    return {
      personalizedOpening: `I noticed ${businessName}'s presence in ${location || "your region"} and wanted to reach out directly.`,
      keyObservation: "Standard outreach observation (budget cap active)",
    };
  }

  // 2. Check content-hash cache
  const contentToHash = `${businessName}|${category}|${location}|${website}`;
  const cacheKey = aiCache.generateKey("lead_personalization", env.AI_MODEL_PERSONALIZE, contentToHash);
  const cached = await aiCache.get<PersonalizationOutput>(cacheKey);
  if (cached) {
    return cached;
  }

  // 3. Fallback if API key missing
  if (!env.GEMINI_API_KEY) {
    return {
      personalizedOpening: `I was looking at ${businessName}'s web presence in ${location || "your area"} and noticed great potential to enhance user conversion.`,
      keyObservation: "Template observation",
    };
  }

  // 4. Call Gemini via LangChain
  try {
    const model = getGeminiModel("personalize");
    const userPrompt = `
Business: ${businessName}
Category: ${category || "General"}
Location: ${location || "Unknown"}
Website: ${website || "None"}

Write a 1-2 sentence personalized opening.
    `.trim();

    const response = await model.invoke([
      new SystemMessage(LEAD_PERSONALIZATION_SYSTEM_PROMPT),
      new HumanMessage(userPrompt),
    ]);

    const contentText = String(response.content || "{}");
    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    const parsedJson = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const validated = personalizationOutputSchema.parse(parsedJson);

    // Record token usage
    await aiUsageService.recordUsage({
      userId,
      task: "personalize",
      model: env.AI_MODEL_PERSONALIZE,
      inputTokens: 200,
      outputTokens: 80,
    });

    // Save to cache
    await aiCache.set(cacheKey, validated);

    return validated;
  } catch (err: any) {
    logger.error({ err }, "Gemini personalization failed; returning deterministic fallback");
    return {
      personalizedOpening: `I noticed ${businessName}'s work in ${location || "your space"} and wanted to connect with your team.`,
      keyObservation: "Deterministic fallback",
    };
  }
}
