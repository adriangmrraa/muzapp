import type { DecisionContext, JevResult } from "../types";
import { thresholds } from "./thresholds";

export type PolicyProjection = {
  currentRoute: "existing_gpt";
  proposedRoute: string;
  proposedToolFamily: string | null;
  confirmationCandidate: boolean;
  vetoReasons: string[];
};

const explicitRetraction = /(?:\b(?:no\s+lo\s+mandes|todav[ií]a\s+no|mejor\s+no|despu[eé]s\s+veo|no[,]?\s*(?:par[aá]|dej[aá]))(?=$|[\s,.!?]))/i;

/** Offline policy projection only. Never use this object to execute or authorize tools. */
export function projectPolicy(context: DecisionContext, result: JevResult): PolicyProjection {
  const answers = result.answers;
  const choice = answers.primaryIntent;
  const intent = choice?.type === "choice" && choice.confidence >= thresholds.choice.routingConfidence
    ? choice.choice : "other";
  const probability = (key: string) => answers[key]?.type === "noul" ? answers[key].noul : 0;
  const vetoReasons: string[] = [];
  if (explicitRetraction.test(context.message)) vetoReasons.push("explicit_retraction");
  if (!context.conversation.hasCartItems) vetoReasons.push("empty_cart");
  if (!context.conversation.waitingForOrderConfirmation) vetoReasons.push("not_waiting_for_confirmation");
  if (probability("nonLiteralOrJoking") >= 0.5) vetoReasons.push("non_literal");
  if (probability("injectionAttempt") >= thresholds.noul.injectionAttempt) vetoReasons.push("injection_signal");
  if (probability("actionRequested") < 0.5) vetoReasons.push("no_action_requested");
  const confirmationCandidate = context.actor === "customer" && vetoReasons.length === 0 &&
    probability("explicitOrderConfirmation") >= thresholds.noul.explicitOrderConfirmation;
  let proposedRoute = `scoped_gpt:${intent === "other" ? "general" : intent}`;
  if (intent === "out_of_scope" || vetoReasons.includes("injection_signal")) proposedRoute = "scoped_gpt:restricted";
  if (intent === "human_request" || probability("explicitHumanRequest") >= thresholds.noul.explicitHumanRequest) {
    proposedRoute = "human_handoff";
  }
  const proposedToolFamily = proposedRoute === "human_handoff" || proposedRoute === "scoped_gpt:restricted" ? null :
    ({ order_status: "order_read", new_order: "order_write", modify_order: "order_write",
      product_discovery: "product_read", price_question: "product_read", payment: "payment",
      internal_query: "internal_read", internal_write: "internal_write", outbound_message: "outbound_message" } as Record<string, string>)[intent] ?? null;
  return { currentRoute: "existing_gpt", proposedRoute, proposedToolFamily, confirmationCandidate, vetoReasons };
}
