export const QUEUE_NAMES = {
  EMAIL_SEND: "email-send",
  SHEET_FLUSH: "sheet-flush",
  INBOX_SYNC: "inbox-sync",
  AI_CLASSIFY: "ai-classify",
  MAINTENANCE: "maintenance",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
