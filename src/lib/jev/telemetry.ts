import type { Actor, JevResult } from "./types";
import { QUESTION_SET_VERSION, THRESHOLD_VERSION } from "./config";
export type DecisionTelemetry = {
  timestamp: string; actor: Actor; channel: string; requestedModel: string;
  returnedModel?: string; policyVersion: string; questionSetVersion: string;
  thresholdVersion: string; latencyMs: number; usage?: JevResult["usage"];
  answers?: JevResult["answers"]; mode: "shadow"; fallbackReason?: string; proposedRoute?: string;
  currentRoute: "existing_gpt"; proposedToolFamily?: string | null;
  confirmationCandidate?: boolean; vetoReasons?: string[];
};
export function recordDecision(event: Omit<DecisionTelemetry, "timestamp" | "questionSetVersion" | "thresholdVersion" | "mode">) {
  // Structured metadata only: no raw state, phone, address, secrets or model reasoning.
  console.info("[jev:shadow]", JSON.stringify({ ...event, timestamp: new Date().toISOString(), questionSetVersion: QUESTION_SET_VERSION, thresholdVersion: THRESHOLD_VERSION, mode: "shadow" }));
}
