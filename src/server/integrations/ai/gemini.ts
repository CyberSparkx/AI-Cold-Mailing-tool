import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "@/server/platform/config/env";
import { AppError } from "@/server/platform/errors/app-error";

export function getGeminiModel(tier: "classify" | "personalize" | "escalate" = "classify") {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw AppError.badRequest("GEMINI_API_KEY is not configured in environment");
  }

  let modelName = env.AI_MODEL_CLASSIFY;
  let temperature = 0.1;
  let maxOutputTokens = 256;

  if (tier === "personalize") {
    modelName = env.AI_MODEL_PERSONALIZE;
    temperature = 0.4;
    maxOutputTokens = 512;
  } else if (tier === "escalate") {
    modelName = env.AI_MODEL_ESCALATE;
    temperature = 0.1;
    maxOutputTokens = 256;
  }

  return new ChatGoogleGenerativeAI({
    apiKey,
    modelName,
    temperature,
    maxOutputTokens,
  });
}
