import { redis } from "./redis";
import { BUFFER_CONFIG, type Channel } from "./config";

function bufferKey(channel: Channel, userId: string) {
  return `buffer:${channel}:${userId}`;
}

function timerKey(channel: Channel, userId: string) {
  return `timer:${channel}:${userId}`;
}

function lockKey(channel: Channel, userId: string) {
  return `lock:${channel}:${userId}`;
}

export interface BufferedMessage {
  content: string;
  messageId: string;
  timestamp: number;
  contentAttributes?: unknown[];
}

export const BufferManager = {
  async enqueue(channel: Channel, userId: string, message: BufferedMessage): Promise<void> {
    if (!redis) return;
    const config = BUFFER_CONFIG[channel];
    const bKey = bufferKey(channel, userId);
    const tKey = timerKey(channel, userId);

    await redis.rpush(bKey, JSON.stringify(message));

    const debounceSeconds = Math.ceil(config.debounceMs / 1000);
    await redis.set(tKey, Date.now().toString(), { ex: debounceSeconds });

    await redis.expire(bKey, 600);
  },

  async acquireLock(channel: Channel, userId: string): Promise<boolean> {
    if (!redis) return true;
    const config = BUFFER_CONFIG[channel];
    const lKey = lockKey(channel, userId);
    const lockTtlSeconds = Math.ceil(config.lockTtlMs / 1000);

    const result = await redis.set(lKey, Date.now().toString(), {
      nx: true,
      ex: lockTtlSeconds,
    });
    return result === "OK";
  },

  async releaseLock(channel: Channel, userId: string): Promise<void> {
    if (!redis) return;
    await redis.del(lockKey(channel, userId));
  },

  async isTimerExpired(channel: Channel, userId: string): Promise<boolean> {
    if (!redis) return true;
    const tKey = timerKey(channel, userId);
    const exists = await redis.exists(tKey);
    return exists === 0;
  },

  async fetchAndClear(channel: Channel, userId: string): Promise<BufferedMessage[]> {
    if (!redis) return [];
    const bKey = bufferKey(channel, userId);

    const raw = await redis.lrange(bKey, 0, -1);

    await redis.del(bKey);

    return raw.map((item) => {
      if (typeof item === "string") return JSON.parse(item) as BufferedMessage;
      return item as BufferedMessage;
    });
  },

  async hasNewMessages(channel: Channel, userId: string): Promise<boolean> {
    if (!redis) return false;
    const bKey = bufferKey(channel, userId);
    const len = await redis.llen(bKey);
    return len > 0;
  },

  // Level-2 content dedup: returns true if the same content was seen in the last 5 seconds
  async isContentDuplicate(channel: Channel, userId: string, content: string): Promise<boolean> {
    if (!redis) return false;
    const hashKey = `dedup:${channel}:${userId}`;
    // Simple fingerprint: first 50 chars, lowercased and trimmed
    const hash = content.toLowerCase().trim().slice(0, 50);

    const existing = await redis.get(hashKey);
    if (existing === hash) return true;

    await redis.set(hashKey, hash, { ex: 5 });
    return false;
  },
};
