export const BUFFER_CONFIG = {
  whatsapp: {
    debounceMs: 11_000,  // 11 seconds grace period
    lockTtlMs: 300_000,  // 5 min lock safety
    maxBufferSize: 20,
  },
  telegram: {
    debounceMs: 8_000,   // 8 seconds grace period
    lockTtlMs: 300_000,
    maxBufferSize: 20,
  },
} as const;

export type Channel = "whatsapp" | "telegram";
