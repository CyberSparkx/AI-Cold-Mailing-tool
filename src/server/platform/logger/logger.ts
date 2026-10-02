import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

// We avoid pino-pretty's worker-thread transport inside Next.js because thread-stream
// worker threads terminate upon Next.js HMR/Fast Refresh reloads causing "Error: the worker has exited".
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "accessToken",
      "refreshToken",
      "password",
      "token",
      "secret",
    ],
    censor: "[REDACTED]",
  },
});
