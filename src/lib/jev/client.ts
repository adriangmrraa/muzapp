import { TypeSafeClient } from "@typesafe-ai/sdk";
import { CircuitBreaker } from "@/lib/infra/circuit-breaker";
export const typesafeCircuitBreaker = new CircuitBreaker();
export function jevClient(apiKey: string, model: string) {
  // SDK debug logs contain unredacted state. Always disable SDK logging.
  return new TypeSafeClient({ apiKey, defaultModel: model, logLevel: "off" });
}
