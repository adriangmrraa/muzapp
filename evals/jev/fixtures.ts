import { readFileSync } from "node:fs";
import { join } from "node:path";
import { decisionContext } from "../../src/lib/jev/context";
import type { Actor, DecisionContext } from "../../src/lib/jev/types";
export type Fixture = { id: string; source: string; actor: Actor; message: string;
  conversation: Partial<DecisionContext["conversation"]>; media?: DecisionContext["media"];
  expected: Record<string, string | boolean>;
  expectedPolicy?: { proposedRoute?: string; confirmationCandidate?: boolean };
  mockAnswers?: Record<string, number> };
export function fixtures(): Fixture[] {
  return ["customer", "seller", "admin"].flatMap((actor) =>
    readFileSync(join(process.cwd(), "evals", "jev", `${actor}-turns.jsonl`), "utf8").trim().split("\n")
      .map((line) => JSON.parse(line) as Fixture));
}
export const fixtureContext = (fixture: Fixture) => decisionContext({
  actor: fixture.actor, channel: fixture.actor === "admin" ? "telegram" : "whatsapp",
  message: fixture.message, conversation: fixture.conversation, media: fixture.media,
});
