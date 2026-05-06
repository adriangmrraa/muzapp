import pino from "pino";

// Correlation ID generator
export function createCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// pino logger - output as JSON for production, pretty for dev
export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  formatters: {
    log: (log) => ({
      ...log,
      // log.time puede ser epoch timestamp number
      timestamp: typeof log.time === "number" ? new Date(log.time).toISOString() : undefined,
    }),
  },
});

export function createLogger(correlationId: string) {
  return logger.child({ correlationId });
}

// Helpers for structured logging
export function logRequestReceived(logger: pino.Logger, data: {
  messageId: string;
  chatId: number;
  text?: string;
}) {
  logger.info({ event: "request_received", ...data }, "Telegram update received");
}

export function logProcessing(logger: pino.Logger, data: {
  duration: number;
}) {
  logger.info({ event: "processing_complete", ...data }, "Message processed");
}

export function logError(logger: pino.Logger, error: Error, context: Record<string, unknown>) {
  logger.error({ event: "error", error: error.message, stack: error.stack, ...context }, "Error in handler");
}