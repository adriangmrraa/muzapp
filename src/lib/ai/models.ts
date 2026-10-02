/**
 * Central AI model/provider configuration.
 *
 * The Vercel AI SDK's default `openai` provider reads:
 *   - OPENAI_API_KEY  (required)
 *   - OPENAI_BASE_URL (optional — point to any OpenAI-compatible endpoint:
 *     OpenRouter https://openrouter.ai/api/v1, DeepSeek https://api.deepseek.com/v1,
 *     Groq https://api.groq.com/openai/v1, Together, Ollama, etc.)
 *
 * Model names below are overridable via env so a provider swap only needs
 * env vars, no code changes. When using a non-OpenAI provider, set the model
 * names that provider expects (e.g. OPENAI_BASE_URL=openrouter +
 * AI_MODEL=openai/gpt-5.4-mini or AI_MODEL=deepseek/deepseek-chat).
 *
 * NOTE: audio transcription (whisper) and any direct api.openai.com calls are
 * OpenAI-only — a provider swap does not move those.
 */

/** Main conversational agent model (WhatsApp sales agent). */
export const AI_MODEL = process.env.AI_MODEL ?? "gpt-5.4-mini";

/** Fast/cheap model for internal agent + Telegram handler. */
export const AI_MODEL_FAST = process.env.AI_MODEL_FAST ?? "gpt-5-mini";

/** Vision model for image understanding (must support image inputs). */
export const AI_MODEL_VISION = process.env.AI_MODEL_VISION ?? "gpt-4o";

/** Base URL for direct (non-SDK) calls — defaults to OpenAI. */
export const AI_BASE_URL =
  (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
