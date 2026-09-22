import { fixtures } from "./fixtures";
import { toolAllowed, toolManifest } from "../../src/lib/agent-policy/tool-manifest";
import { proposedRoute } from "../../src/lib/jev/policy/customer";
import type { JevResult } from "../../src/lib/jev/types";
const all = fixtures();
if (!all.length) throw new Error("No fixtures");
for (const f of all) {
  if (f.expected.primaryIntent) {
    const result: JevResult = { model: "jev-1.13.0", usage: { input_tokens: 0, output_tokens: 0 }, answers: {
      primaryIntent: { type: "choice", choice: String(f.expected.primaryIntent), confidence: .95, probabilities: { [String(f.expected.primaryIntent)]: .95 } },
    } };
    if (!proposedRoute(result)) throw new Error(f.id);
  }
}
if (toolAllowed("broadcastWhatsApp", "seller") || !toolAllowed("broadcastWhatsApp", "admin")) throw new Error("Broadcast permissions");
if (Object.keys(toolManifest).length < 70) throw new Error("Manifest incomplete");
console.log(`Agent policy PASS: ${all.length} fixtures, ${Object.keys(toolManifest).length} tools; broadcast admin-only.`);
