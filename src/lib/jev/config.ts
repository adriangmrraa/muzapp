export const JEV_DEFAULT_MODEL = "jev-1.13.0";
export const POLICY_VERSION = "shadow-v1";
export const QUESTION_SET_VERSION = "preflight-es-v1";
export const THRESHOLD_VERSION = "thresholds-v1";
const numeric = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};
export function jevConfig(actor: "customer" | "seller" | "admin" | "automation") {
  const realtime = actor === "customer";
  const model = process.env.JEV_MODEL || JEV_DEFAULT_MODEL;
  return {
    enabled: process.env.JEV_ENABLED === "true" && process.env.JEV_SHADOW_MODE === "true",
    model,
    policyVersion: process.env.JEV_POLICY_VERSION || POLICY_VERSION,
    timeout: numeric(realtime ? "JEV_REALTIME_TIMEOUT_MS" : "JEV_INTERNAL_TIMEOUT_MS", realtime ? 700 : 1500),
    maxRetries: numeric(realtime ? "JEV_REALTIME_MAX_RETRIES" : "JEV_INTERNAL_MAX_RETRIES", realtime ? 0 : 1),
  };
}
