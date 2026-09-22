export type Actor = "customer" | "seller" | "admin" | "automation";
export type DecisionContext = {
  actor: Actor;
  channel: "whatsapp" | "telegram" | "meta";
  message: string;
  conversation: {
    hasCartItems: boolean;
    hasActiveOrder: boolean;
    deliveryAgreed: boolean;
    waitingForOrderConfirmation: boolean;
    repliedToStatusNotification: boolean;
    pendingActionType?: string;
    previousSemanticTopic?: string;
  };
  media?: { kind: "none" | "audio" | "image" | "document" | "video" | "location"; semanticSummary?: string };
};
export type JevAnswer = { type: "noul"; noul: number } | { type: "choice"; choice: string; confidence: number; probabilities: Record<string, number> } | { type: "score"; score: number; confidence: number; probabilities: Record<string, number>; legend: Record<string, unknown> };
export type JevResult = { model: string; answers: Record<string, JevAnswer>; usage: { input_tokens: number; output_tokens: number } };
