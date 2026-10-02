import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Auth.js
  AUTH_SECRET: z.string().min(16).default("temporary_dev_auth_secret_minimum_32_characters"),
  AUTH_TRUST_HOST: z.string().optional().default("true"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional().default("http://localhost:3000/api/google/callback"),
  GOOGLE_PICKER_API_KEY: z.string().optional().default(""),

  // Encryption & Signatures
  TOKEN_ENCRYPTION_KEY: z.string().optional().default("YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY="),
  TOKEN_ENCRYPTION_KEY_VERSION: z.coerce.number().default(1),
  UNSUBSCRIBE_SIGNING_KEY: z.string().optional().default("dW5zdWJzY3JpYmVfc2lnbmluZ19rZXlfMzJfYnl0ZXM="),
  CRON_SECRET: z.string().optional().default("dev_cron_secret"),

  // Database
  DATABASE_URL: z.string().default("mongodb://localhost:27017/cold_mailing"),

  // Redis & Queue
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_KEY_PREFIX: z.string().default("app:dev:"),
  QUEUE_DRIVER: z.enum(["bullmq", "noop"]).default("bullmq"),

  // Gemini AI
  GEMINI_API_KEY: z.string().optional().default(""),
  AI_MODEL_CLASSIFY: z.string().default("gemini-2.0-flash-lite"),
  AI_MODEL_PERSONALIZE: z.string().default("gemini-2.0-flash"),
  AI_MODEL_ESCALATE: z.string().default("gemini-2.0-flash"),

  // Lead Providers
  SCRAPE_DO_API_KEY: z.string().optional().default(""),
  GOOGLE_PLACES_API_KEY: z.string().optional().default(""),
  OSM_OVERPASS_URL: z.string().default("https://overpass-api.de/api/interpreter"),
  SEARCH_API_KEY: z.string().optional().default(""),
  SITE_FETCH_USER_AGENT: z.string().default("OutreachDashboard/1.0 (+https://narenroy.in/)"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;
