import { Redis } from "@upstash/redis";

export const QUEUE_KEY = "queue:messages";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = !!(redisUrl && redisToken && redisUrl.startsWith("https://"));

let redis: Redis | null = null;

if (hasRedis) {
  redis = new Redis({
    url: redisUrl!,
    token: redisToken!,
  });
} else {
  console.warn("[queue] UPSTASH_REDIS not configured — producer is a no-op");
}

export async function enqueueMessage(
  chatId: string | number,
  payload: object,
): Promise<boolean> {
  if (!redis) {
    console.warn("[queue] no-op enqueueMessage");
    return false;
  }

  try {
    const message = JSON.stringify({
      ...payload,
      chatId,
      timestamp: Date.now(),
      retryCount: 0,
    });

    await redis.lpush(QUEUE_KEY, message);
    console.log("[queue] enqueued", { chatId, type: (payload as Record<string, unknown>).type });
    return true;
  } catch (err) {
    console.error("[queue] enqueueMessage error:", err);
    return false;
  }
}
