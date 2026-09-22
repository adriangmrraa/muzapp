import { jevClient } from "../../src/lib/jev/client";
import { JEV_DEFAULT_MODEL } from "../../src/lib/jev/config";
import { preflightQuestions } from "../../src/lib/jev/preflight";
import { thresholds } from "../../src/lib/jev/policy/thresholds";
import { validResult } from "../../src/lib/jev/shadow";
import { fixtureContext, fixtures } from "./fixtures";
import { metrics } from "./metrics";
async function main() {
const all = fixtures();
const signals = [...new Set(all.flatMap((f) => Object.keys(f.expected)))];
console.log(`Jev eval: ${all.length} cases, ${signals.length} signals, sources: ${[...new Set(all.map((f) => f.source))].join(", ")}`);
if (!process.env.TYPESAFE_API_KEY) {
  console.log("SKIPPED live model metrics: TYPESAFE_API_KEY absent. Fixture coverage validated; no quality score fabricated.");
  return;
}
const model = process.env.JEV_MODEL || JEV_DEFAULT_MODEL;
if (!/^jev-\d+\.\d+\.\d+$/.test(model)) throw new Error("Use a pinned model");
const client = jevClient(process.env.TYPESAFE_API_KEY, model);
const observations: Record<string, { expected: boolean; actual: boolean }[]> = {};
for (const fixture of all) {
  const result = await client.systemOne({ state: fixtureContext(fixture), questions: preflightQuestions, model }, { timeout: 5000, retry: { maxRetries: 1 } });
  if (!validResult(result)) throw new Error(`Invalid model response for ${fixture.id}`);
  for (const [signal, expected] of Object.entries(fixture.expected)) {
    const answer = result.answers[signal as keyof typeof result.answers];
    let actual: string | boolean = false;
    if (answer?.type === "choice") actual = answer.choice;
    if (answer?.type === "noul") actual = answer.noul >= ((thresholds.noul as Record<string, number>)[signal] ?? 0.5);
    if (answer?.type === "score") actual = answer.score >= thresholds.score.frustration;
    if (typeof expected === "string") {
      for (const label of Object.keys(preflightQuestions.primaryIntent.criteria)) {
        (observations[`${signal}:${label}`] ??= []).push({ expected: label === expected, actual: label === actual });
      }
    } else {
      (observations[signal] ??= []).push({ expected, actual: actual === true });
    }
  }
}
for (const [signal, values] of Object.entries(observations)) console.log(signal, metrics(values));

}
main().catch((error) => { console.error(error); process.exitCode = 1; });
