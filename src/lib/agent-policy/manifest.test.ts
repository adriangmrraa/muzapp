import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toolManifest } from "./tool-manifest";
test("seller prompt does not advertise unavailable broadcast or deletion tools or static prices", () => {
  const prompt = readFileSync("src/lib/whatsapp/seller-prompt.ts", "utf8");
  assert.doesNotMatch(prompt, /broadcastWhatsApp|deleteLead|\(\$\d/);
  assert.equal(toolManifest.broadcastWhatsApp.allowedRoles.includes("seller"), false);
});

test("manifest covers every currently exposed named tool", () => {
  for (const [path, opening, closing] of [
    ["src/lib/telegram/tools.ts", "export const internalAgentTools = {", "\n};"],
    ["src/lib/whatsapp/seller-prompt.ts", "export const internalSellerTools = {", "\n};"],
    ["src/lib/whatsapp/agent.ts", "const agentTools = {", "\n  };"],
  ]) {
    const contents = readFileSync(path, "utf8");
    const body = contents.split(opening)[1]?.split(closing)[0] ?? "";
    const names = [...body.matchAll(/^\s+(\w+):\s+\w+/gm)].map((m) => m[1]);
    assert.ok(names.length > 20, path);
    for (const name of names) assert.ok(toolManifest[name], `${path}: ${name}`);
  }
});
