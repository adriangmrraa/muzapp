import type { JevResult } from "../types";
import { thresholds } from "./thresholds";
export function proposedRoute(result: JevResult): string {
  const intent = result.answers.primaryIntent;
  if (intent?.type !== "choice" || intent.confidence < thresholds.choice.routingConfidence) return "scoped_gpt:general";
  if (intent.choice === "human_request") return "human_handoff";
  if (intent.choice === "out_of_scope") return "scoped_gpt:restricted";
  return `scoped_gpt:${intent.choice}`;
}
