import { test } from "node:test";
import assert from "node:assert/strict";
import { TypeSafeClient } from "@typesafe-ai/sdk";
import { decisionContext } from "./context";
import { decisionCacheKey } from "./cache";
import { validResult, observeJevShadow } from "./shadow";
import { typesafeCircuitBreaker } from "./client";
import { phoneInList, phoneMatches } from "../phone-utils";
import { whatsappActor } from "../agent-policy/roles";
import { mergeBufferedTurn } from "../whatsapp/buffered-history";
import { toolAllowed, toolManifest } from "../agent-policy/tool-manifest";
import { preflightQuestions } from "./preflight";

test("seller identity resolves before lead path; configured phones match canonical digits", () => {
  assert.equal(phoneMatches("+54 9 3704 868421", "5493704868421"), true);
  assert.equal(phoneInList("+54 9 3704 868421", [{ phone: "5493704868421" }]), true);
  assert.equal(whatsappActor("+54 9 3704 868421", [{ phone: "5493704868421" }]), "seller");
  assert.equal(whatsappActor("+54 9 3704 868422", [{ phone: "5493704868421" }]), "customer");
});
test("buffered seller and customer turns appear once", () => {
  assert.deepEqual(mergeBufferedTurn([{ role: "assistant", content: "hola" }, { role: "user", content: "ya" }, { role: "user", content: "voy" }], [{ content: "ya" }, { content: "voy" }]), [
    { role: "assistant", content: "hola" }, { role: "user", content: "ya\nvoy" },
  ]);
  assert.deepEqual(mergeBufferedTurn([{ role: "user", content: "[Imagen recibida]", platformMessageId: "wamid1" }, { role: "system", content: "pedido listo" }], [{ content: "Imagen: menú", messageId: "wamid1" }]), [{ role: "system", content: "pedido listo" }, { role: "user", content: "Imagen: menú" }]);
});
test("manifest contains permissions and risk metadata for sensitive tools", () => {
  assert.equal(toolAllowed("broadcastWhatsApp", "seller"), false);
  assert.equal(toolAllowed("broadcastWhatsApp", "admin"), true);
  assert.equal(toolManifest.broadcastWhatsApp.riskClass, "bulk_external");
  assert.equal(toolManifest.markAsPaid.riskClass, "financial");
  assert.equal(toolManifest.getOrderStatus.riskClass, "read_only");
  assert.equal(toolAllowed("madeUpTool", "admin"), false);
});
test("context minimizes PII and cache includes state and versions", () => {
  const state = decisionContext({ actor: "customer", channel: "whatsapp", message: "llamame al +5493704868421", conversation: { hasCartItems: true } });
  assert.equal(state.message.includes("5493704868421"), false);
  assert.equal(state.conversation.hasCartItems, true);
  assert.notEqual(decisionCacheKey("jev-1.13.0", "v1", state), decisionCacheKey("jev-1.13.0", "v2", state));
  assert.notEqual(decisionCacheKey("jev-1.13.0", "v1", state), decisionCacheKey("jev-1.13.1", "v1", state));
});
test("malformed responses fail validation and cannot affect the shadow path", async () => {
  assert.equal(validResult({ model: "jev-1.13.0", answers: {}, usage: { input_tokens: 1 } }), false);
  const state = decisionContext({ actor: "customer", channel: "whatsapp", message: "hola" });
  const before = process.env.JEV_ENABLED;
  process.env.JEV_ENABLED = "false";
  try { assert.equal(await observeJevShadow(state), undefined); } finally {
    if (before === undefined) delete process.env.JEV_ENABLED; else process.env.JEV_ENABLED = before;
  }
});
test("SDK accepts fan-out, pinned model and explicit per-attempt timeout and retry count", async () => {
  const client = new TypeSafeClient({ apiKey: "fake-key", defaultModel: "jev-1.13.0", logLevel: "off", fetch: async (_url, init) => {
    const body = JSON.parse(init!.body as string);
    assert.equal(body.model, "jev-1.13.0");
    assert.equal(Object.keys(body.questions).length, 11);
    return new Response(JSON.stringify({ model: body.model, answers: {}, usage: { input_tokens: 1, output_tokens: 1 } }), { status: 200, headers: { "content-type": "application/json" } });
  } });
  const response = await client.systemOne({ state: { message: "hola" }, questions: preflightQuestions }, { timeout: 700, retry: { maxRetries: 0 } });
  assert.equal(response.model, "jev-1.13.0");
  assert.equal(validResult(response), false);
});
test("429 and timeout are isolated in TypeSafe breaker", async () => {
  const rejected = Promise.reject(new Error("429"));
  await assert.rejects(typesafeCircuitBreaker.call(() => rejected), /429/);
  await assert.rejects(typesafeCircuitBreaker.call(() => Promise.reject(new Error("timeout"))), /timeout/);
});

test("SDK 429 is fail-open material with retries disabled", async () => {
  let attempts = 0;
  const client = new TypeSafeClient({ apiKey: "fake", logLevel: "off", fetch: async () => {
    attempts++;
    return new Response(JSON.stringify({ error: { message: "rate limit" } }), { status: 429, headers: { "content-type": "application/json" } });
  } });
  await assert.rejects(client.systemOne({ state: "hola", questions: preflightQuestions, model: "jev-1.13.0" }, { retry: { maxRetries: 0 } }), (error: Error) => error.name === "RateLimitError");
  assert.equal(attempts, 1);
});
test("SDK timeout is per attempt and does not reach GPT breaker", async () => {
  const client = new TypeSafeClient({ apiKey: "fake", logLevel: "off", fetch: async (_url, init) =>
    new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))) });
  await assert.rejects(client.systemOne({ state: "hola", questions: preflightQuestions, model: "jev-1.13.0" }, { timeout: 15, retry: { maxRetries: 0 } }), (error: Error) => error.name === "APITimeoutError");
});
