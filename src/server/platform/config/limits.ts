
export const LIMITS = {
  // Sending safety
  HARD_DAILY_CAP: parseInt(process.env.HARD_DAILY_CAP || '100', 10),
  DEFAULT_DAILY_LIMIT: parseInt(process.env.DEFAULT_DAILY_LIMIT || '25', 10),
  WARMUP_ENABLED: process.env.WARMUP_ENABLED !== 'false',
  SEND_MIN_DELAY_SEC: parseInt(process.env.SEND_MIN_DELAY_SEC || '45', 10),
  SEND_MAX_DELAY_SEC: parseInt(process.env.SEND_MAX_DELAY_SEC || '150', 10),
  BREAKER_FAILURE_THRESHOLD: parseFloat(process.env.BREAKER_FAILURE_THRESHOLD || '0.05'),

  // AI Cost guardrails
  AI_MONTHLY_TOKEN_CAP: parseInt(process.env.AI_MONTHLY_TOKEN_CAP || '1000000', 10),
  AI_BATCH_SIZE: parseInt(process.env.AI_BATCH_SIZE || '15', 10),
  AI_MAX_INPUT_CHARS: parseInt(process.env.AI_MAX_INPUT_CHARS || '1500', 10),

  // Search & Lead Provider limits
  LEADS_MAX_RESULTS_PER_SEARCH: parseInt(process.env.LEADS_MAX_RESULTS_PER_SEARCH || '100', 10),
  PLACES_DAILY_REQUEST_BUDGET: parseInt(process.env.PLACES_DAILY_REQUEST_BUDGET || '200', 10),

  // Inbox Sync limits
  INBOX_MIN_SYNC_INTERVAL_SEC: parseInt(process.env.INBOX_MIN_SYNC_INTERVAL_SEC || '300', 10),
  INBOX_RETENTION_DAYS: parseInt(process.env.INBOX_RETENTION_DAYS || '90', 10),
} as const;
