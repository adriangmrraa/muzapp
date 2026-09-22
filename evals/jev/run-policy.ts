import { fixtures, fixtureContext } from "./fixtures";
import { toolAllowed, toolManifest } from "../../src/lib/agent-policy/tool-manifest";
import { intents, preflightQuestions } from "../../src/lib/jev/preflight";
import { projectPolicy } from "../../src/lib/jev/policy/projection";
import { validResult } from "../../src/lib/jev/shadow";
import type { JevResult } from "../../src/lib/jev/types";
import { metrics } from "./metrics";

const all = fixtures();
const seen = new Set<string>();
let assertions = 0;
let failures = 0;
const confirmationCases: { expected: boolean; actual: boolean }[] = [];
for (const fixture of all) {
  if (seen.has(fixture.id)) throw new Error(`Duplicate fixture ${fixture.id}`);
  seen.add(fixture.id);
  if (!fixture.expectedPolicy) continue;
  const selected = typeof fixture.expected.primaryIntent === "string" ? fixture.expected.primaryIntent : "other";
  if (!intents.includes(selected as typeof intents[number])) throw new Error(`Unknown intent in ${fixture.id}`);
  const answers: JevResult["answers"] = {};
  for (const [key, question] of Object.entries(preflightQuestions)) {
    if (question.type === "choice") {
      answers[key] = { type: "choice", choice: selected, confidence: .95, probabilities: { [selected]: .95 } };
    } else if (question.type === "score") {
      answers[key] = { type: "score", score: fixture.expected.frustration ? 3 : 0,
        confidence: .95, probabilities: { 0: .95 }, legend: { 0: "calm" } };
    } else {
      const override = fixture.mockAnswers?.[key];
      answers[key] = { type: "noul", noul: override ?? (fixture.expected[key] === true ? .999 : .01) };
    }
  }
  const result: JevResult = { model: "jev-1.13.0", usage: { input_tokens: 0, output_tokens: 0 }, answers };
  if (!validResult(result)) throw new Error(`Malformed synthetic decision for ${fixture.id}`);
  const projected = projectPolicy(fixtureContext(fixture), result);
  if (fixture.expectedPolicy.proposedRoute !== undefined) {
    assertions++;
    if (projected.proposedRoute !== fixture.expectedPolicy.proposedRoute) {
      failures++; console.error(`${fixture.id}: route ${projected.proposedRoute}, expected ${fixture.expectedPolicy.proposedRoute}`);
    }
  }
  if (fixture.expectedPolicy.confirmationCandidate !== undefined) {
    assertions++;
    const expected = fixture.expectedPolicy.confirmationCandidate;
    confirmationCases.push({ expected, actual: projected.confirmationCandidate });
    if (projected.confirmationCandidate !== expected) {
      failures++; console.error(`${fixture.id}: confirmation ${projected.confirmationCandidate}, expected ${expected}; veto=${projected.vetoReasons.join(",")}`);
    }
  }
}
if (toolAllowed("broadcastWhatsApp", "seller") || !toolAllowed("broadcastWhatsApp", "admin")) throw new Error("Broadcast permissions");
if (Object.keys(toolManifest).length < 70 || assertions < 15) throw new Error("Insufficient policy coverage");
console.log(`Agent policy: ${all.length} fixtures, ${assertions} policy assertions, ${Object.keys(toolManifest).length} tools.`);
console.log("confirmationCandidate", metrics(confirmationCases));
if (failures) process.exitCode = 1;
