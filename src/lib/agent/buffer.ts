const WINDOW_MS = 16_000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

interface BufferEntry {
  texts: string[];
  timer: ReturnType<typeof setTimeout>;
  lastActivity: number;
}

const buffer = new Map<string, BufferEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - CLEANUP_INTERVAL_MS;
  for (const [phone, entry] of buffer.entries()) {
    if (entry.lastActivity < cutoff) {
      clearTimeout(entry.timer);
      buffer.delete(phone);
    }
  }
}, CLEANUP_INTERVAL_MS);

export function addToBuffer(
  phone: string,
  text: string,
  onFlush: (phone: string, combinedText: string) => void
): void {
  const existing = buffer.get(phone);

  if (existing) {
    existing.texts.push(text);
    existing.lastActivity = Date.now();
    clearTimeout(existing.timer);
    existing.timer = setTimeout(() => {
      const entry = buffer.get(phone);
      if (entry) {
        buffer.delete(phone);
        onFlush(phone, entry.texts.join("\n"));
      }
    }, WINDOW_MS);
  } else {
    const timer = setTimeout(() => {
      const entry = buffer.get(phone);
      if (entry) {
        buffer.delete(phone);
        onFlush(phone, entry.texts.join("\n"));
      }
    }, WINDOW_MS);

    buffer.set(phone, {
      texts: [text],
      timer,
      lastActivity: Date.now(),
    });
  }
}
