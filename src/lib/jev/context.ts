import type { Actor, DecisionContext } from "./types";
/** Construct only decision-relevant state. Never attach phone, address, full prompt or credentials. */
export function decisionContext(input: {
  actor: Actor; channel: DecisionContext["channel"]; message: string;
  conversation?: Partial<DecisionContext["conversation"]>; media?: DecisionContext["media"];
}): DecisionContext {
  const { conversation = {} } = input;
  return {
    actor: input.actor, channel: input.channel,
    message: redactIdentifiers(input.message).slice(0, 2000),
    conversation: {
      hasCartItems: conversation.hasCartItems === true,
      hasActiveOrder: conversation.hasActiveOrder === true,
      deliveryAgreed: conversation.deliveryAgreed === true,
      waitingForOrderConfirmation: conversation.waitingForOrderConfirmation === true,
      repliedToStatusNotification: conversation.repliedToStatusNotification === true,
      ...(conversation.pendingActionType ? { pendingActionType: conversation.pendingActionType.slice(0, 80) } : {}),
      ...(conversation.previousSemanticTopic ? { previousSemanticTopic: conversation.previousSemanticTopic.slice(0, 80) } : {}),
    },
    ...(input.media ? { media: { kind: input.media.kind, ...(input.media.semanticSummary ? { semanticSummary: input.media.semanticSummary.slice(0, 200) } : {}) } } : {}),
  };
}

/** Keep quantities and order IDs, remove long phone numbers and obvious addresses. */
export function redactIdentifiers(value: string): string {
  return value.replace(/(?:\+?54[\s-]?)?(?:\d[\s-]?){10,13}/g, "[phone]")
    .replace(/\b(?:calle|av\.?|avenida|pasaje)\s+[^,.\n]{3,45}\s+\d{1,5}\b/gi, "[address]")
    .replace(/\b(?:a|en|por)\s+(?:[a-záéíóúñ]+\s+){1,3}\d{1,5}\b/gi, "[address]");
}
