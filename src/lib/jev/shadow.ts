import { jevConfig } from "./config";
import { jevClient, typesafeCircuitBreaker } from "./client";
import type { CircuitBreaker } from "@/lib/infra/circuit-breaker";
import { cachedDecision, cacheDecision, decisionCacheKey } from "./cache";
import { intents, preflightQuestions } from "./preflight";
import { projectPolicy } from "./policy/projection";
import { recordDecision } from "./telemetry";
import type { DecisionContext, JevResult } from "./types";

export type ShadowDependencies = {
  /** Controlled transport for deterministic tests; never used for production routing. */
  request?: (context: DecisionContext, model: string, timeoutMs: number, maxRetries: number) => Promise<unknown>;
  emit?: typeof recordDecision;
  breaker?: CircuitBreaker;
};
/** Observe only. This return value is deliberately void: no routing, blocking or tools. */
export async function observeJevShadow(context: DecisionContext, deps: ShadowDependencies = {}): Promise<void> {
  const config = jevConfig(context.actor);
  if (!config.enabled) return;
  const started = Date.now();
  let fallbackReason: string | undefined;
  let result: JevResult | undefined;
  try {
    if (!process.env.TYPESAFE_API_KEY && !deps.request) throw new Error("missing_api_key");
    if (!/^jev-\d+\.\d+\.\d+$/.test(config.model)) throw new Error("unpinned_model");
    const key = decisionCacheKey(config.model, config.policyVersion, context);
    result = await cachedDecision(key) ?? undefined;
    if (!result) {
      const response = await (deps.breaker ?? typesafeCircuitBreaker).call(() => deps.request
        ? deps.request(context, config.model, config.timeout, config.maxRetries)
        : jevClient(process.env.TYPESAFE_API_KEY!, config.model).systemOne(
            { state: context, model: config.model, questions: preflightQuestions },
            { timeout: config.timeout, retry: { maxRetries: config.maxRetries } },
          ));
      result = response as JevResult;
      if (!validResult(result)) throw new Error("malformed_output");
      await cacheDecision(key, result);
    }
    if (!validResult(result)) throw new Error("malformed_output");
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown";
    fallbackReason = error instanceof Error && ["missing_api_key", "unpinned_model", "malformed_output"].includes(error.message) ? error.message : reason;
  }
  const projection = result && !fallbackReason ? projectPolicy(context, result) : undefined;
  (deps.emit ?? recordDecision)({ actor: context.actor, channel: context.channel, requestedModel: config.model,
    returnedModel: result && !fallbackReason ? result.model : undefined, policyVersion: config.policyVersion,
    latencyMs: Date.now() - started, usage: result && !fallbackReason ? result.usage : undefined,
    answers: result && !fallbackReason ? result.answers : undefined, fallbackReason,
    proposedRoute: projection?.proposedRoute, currentRoute: "existing_gpt",
    proposedToolFamily: projection?.proposedToolFamily, confirmationCandidate: projection?.confirmationCandidate,
    vetoReasons: projection?.vetoReasons });
}
export function validResult(result: unknown): result is JevResult {
  if (!result || typeof result !== "object") return false;
  const r = result as JevResult;
  if (typeof r.model !== "string" || !Number.isFinite(r.usage?.input_tokens) || !r.answers) return false;
  const a = r.answers;
  return a.primaryIntent?.type === "choice" && typeof a.primaryIntent.choice === "string" && intents.includes(a.primaryIntent.choice as typeof intents[number]) &&
    Number.isFinite(a.primaryIntent.confidence) && a.primaryIntent.confidence >= 0 && a.primaryIntent.confidence <= 1 &&
    Object.keys(preflightQuestions).every((key) => {
      const value = a[key];
      if (!value || value.type !== preflightQuestions[key as keyof typeof preflightQuestions].type) return false;
      if (value.type === "noul") return Number.isFinite(value.noul) && value.noul >= 0 && value.noul <= 1;
      if (value.type === "score") return Number.isFinite(value.score) && value.score >= 0 && value.score <= 4 && Number.isFinite(value.confidence) && value.confidence >= 0 && value.confidence <= 1 && !!value.probabilities;
      return Number.isFinite(value.confidence) && !!value.probabilities;
    });
}
