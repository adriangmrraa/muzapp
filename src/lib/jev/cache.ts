import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { QUESTION_SET_VERSION } from "./config";
import type { DecisionContext, JevResult } from "./types";
export function decisionCacheKey(model: string, policyVersion: string, state: DecisionContext) {
  return `jev:decision:${createHash("sha256").update(JSON.stringify([model, policyVersion, QUESTION_SET_VERSION, state])).digest("hex")}`;
}
let redis: Redis | undefined;
function connection() {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  }
  return redis;
}
export async function cachedDecision(key: string): Promise<JevResult | null> {
  try { return await connection()?.get<JevResult>(key) ?? null; } catch { return null; }
}
export async function cacheDecision(key: string, value: JevResult): Promise<void> {
  try { await connection()?.set(key, value, { ex: 60 }); } catch { /* optional cache */ }
}
