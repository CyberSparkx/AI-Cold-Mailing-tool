import "server-only";
import { getGeminiModel } from "../gemini";
import { aiCache } from "../cache";
import { aiUsageService } from "../usage";
import {
  EMAIL_CLASSIFICATION_SYSTEM_PROMPT,
  classificationOutputSchema,
  ClassificationOutput,
} from "../prompts/emailClassification";
import { env } from "@/server/platform/config/env";
import { logger } from "@/server/platform/logger/logger";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function classifyEmailWithAi(params: {
  userId: string;
  sender: string;
  subject: string;
  snippet: string;
}): Promise<ClassificationOutput> {
  const { userId, sender, subject, snippet } = params;

  // 1. Budget guard
  const budget = await aiUsageService.checkCanSpendTokens(userId);
  if (!budget.canSpend) {
    logger.warn({ userId }, "AI classification degraded to rules-only due to monthly budget limit");
    return {
      category: "GENERAL",
      confidence: 0.5,
      reason: "Classified as general (monthly AI budget cap reached)",
      isOpportunity: false,
    };
  }

  // 2. Check content-hash cache
  const contentToHash = `${sender}|${subject}|${snippet}`;
  const cacheKey = aiCache.generateKey("email_classification", env.AI_MODEL_CLASSIFY, contentToHash);
  const cached = await aiCache.get<ClassificationOutput>(cacheKey);
  if (cached) {
    logger.info({ cacheKey }, "Returning cached AI classification");
    return cached;
  }

  // 3. Fallback if API key missing
  if (!env.GEMINI_API_KEY) {
    const isLead = subject.toLowerCase().includes("inquiry") || subject.toLowerCase().includes("quote");
    return {
      category: isLead ? "WEBSITE_INQUIRY" : "GENERAL",
      confidence: 0.7,
      reason: "Deterministic rule classification (API key not configured)",
      isOpportunity: isLead,
    };
  }

  // 4. Call Gemini via LangChain
  try {
    const model = getGeminiModel("classify");
    const userPrompt = `
Sender: ${sender}
Subject: ${subject}
Snippet: ${snippet}

Classify this email.
    `.trim();

    const response = await model.invoke([
      new SystemMessage(EMAIL_CLASSIFICATION_SYSTEM_PROMPT),
      new HumanMessage(userPrompt),
    ]);

    const contentText = String(response.content || "{}");
    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    const parsedJson = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const validated = classificationOutputSchema.parse(parsedJson);

    // Record token usage (estimate ~250 input, ~60 output)
    await aiUsageService.recordUsage({
      userId,
      task: "classify",
      model: env.AI_MODEL_CLASSIFY,
      inputTokens: 250,
      outputTokens: 60,
    });

    // Save to cache
    await aiCache.set(cacheKey, validated);

    return validated;
  } catch (err: any) {
    logger.error({ err }, "Gemini classification failed; falling back to safe default");
    return {
      category: "GENERAL",
      confidence: 0.5,
      reason: "Automated triage fallback after model exception",
      isOpportunity: false,
    };
  }
}
