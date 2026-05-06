import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = !!(redisUrl && redisToken && redisUrl.startsWith("https://"));

export const redis: Redis | null = hasRedis
  ? new Redis({ url: redisUrl!, token: redisToken! })
  : null;

if (!hasRedis) {
  console.warn("[buffer] UPSTASH_REDIS not configured or invalid URL — buffer uses in-memory fallback");
}
