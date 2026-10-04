/**
 * Runtime AI provider configuration — DB first, env fallback.
 *
 * agent_config.ai_* columns let each deployment point at any
 * OpenAI-compatible provider (OpenAI, OpenRouter, DeepSeek, Groq, Together,
 * Ollama...) from the admin UI without touching env vars or redeploying.
 * Env vars still work as the bootstrap path.
 */

import { createOpenAI, openai as defaultOpenai } from "@ai-sdk/openai";
import type { OpenAIProvider } from "@ai-sdk/openai";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decryptIfEncrypted } from "@/lib/encryption";
import { AI_BASE_URL, AI_MODEL, AI_MODEL_FAST, AI_MODEL_VISION } from "./models";

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  modelFast: string;
  modelVision: string;
}

const ENV_CONFIG: AIConfig = {
  apiKey: process.env.OPENAI_API_KEY ?? "",
  baseUrl: AI_BASE_URL,
  model: AI_MODEL,
  modelFast: AI_MODEL_FAST,
  modelVision: AI_MODEL_VISION,
};

// Short-lived cache — saves a DB hit per inbound message while still picking
// up admin edits within ~30s.
let cached: { at: number; value: AIConfig } | null = null;
const CACHE_TTL_MS = 30_000;

/** Applies an admin provider change to the next inbound agent request. */
export function invalidateAIConfigCache(): void {
  cached = null;
}

export async function getAIConfig(): Promise<AIConfig> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const [cfg] = await db
      .select({
        aiApiKey: agentConfig.aiApiKey,
        aiBaseUrl: agentConfig.aiBaseUrl,
        aiModel: agentConfig.aiModel,
        aiModelFast: agentConfig.aiModelFast,
        aiModelVision: agentConfig.aiModelVision,
      })
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);
    const value: AIConfig = {
      // Stored AES-256-GCM encrypted; tolerant of legacy plaintext rows.
      apiKey: decryptIfEncrypted(cfg?.aiApiKey?.trim() || "") || ENV_CONFIG.apiKey,
      baseUrl: (cfg?.aiBaseUrl?.trim() || ENV_CONFIG.baseUrl).replace(/\/+$/, ""),
      model: cfg?.aiModel?.trim() || ENV_CONFIG.model,
      modelFast: cfg?.aiModelFast?.trim() || ENV_CONFIG.modelFast,
      modelVision: cfg?.aiModelVision?.trim() || ENV_CONFIG.modelVision,
    };
    cached = { at: Date.now(), value };
    return value;
  } catch {
    // Columns may not exist on older deployments — env is the fallback.
    return ENV_CONFIG;
  }
}

/**
 * Returns an OpenAI-compatible provider bound to the resolved credentials.
 * Falls back to the default env-driven provider when the DB has no key.
 */
export async function getAIProvider(): Promise<OpenAIProvider> {
  const cfg = await getAIConfig();
  if (!cfg.apiKey) return defaultOpenai; // lets the SDK surface its own missing-key error
  return createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl });
}

/** Main conversational model (WhatsApp sales agent). */
export async function getMainModel() {
  const [provider, cfg] = await Promise.all([getAIProvider(), getAIConfig()]);
  return provider(cfg.model);
}

/** Main model via Chat Completions API (WhatsApp agent uses openai.chat()). */
export async function getMainChatModel() {
  const [provider, cfg] = await Promise.all([getAIProvider(), getAIConfig()]);
  return provider.chat(cfg.model);
}

/** Fast/cheap model for internal agent + Telegram. */
export async function getFastModel() {
  const [provider, cfg] = await Promise.all([getAIProvider(), getAIConfig()]);
  return provider.chat(cfg.modelFast);
}
