import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeBufferedTurn } from "./whatsapp/buffered-history";
import { phoneInList, phoneMatches } from "./phone-utils";
import { resolveWhatsAppActor, shouldCaptureLead } from "./whatsapp/actor";
import { matchCatalog, validateResolvedOrderItems } from "./order-utils";
import { internalSellerTools } from "./whatsapp/seller-prompt";
import { INTERNAL_AGENT_SYSTEM_PROMPT } from "./telegram/system-prompt";
import { isSafeCustomerNameMatch } from "./telegram/customer-match";
import { readFileSync } from "node:fs";

test("configured seller and allowlist phones match canonical digits", () => {
  assert.equal(phoneMatches("+54 9 3704 868421", "5493704868421"), true);
  assert.equal(phoneMatches("", ""), false);
  assert.equal(phoneInList("+54 9 3704 868421", [{ phone: "5493704868421" }]), true);
});

test("seller resolves before lead capture and delivery takes priority", () => {
  const identities = { sellerPhoneIds: [{ phone: "5493704868421" }], deliveryPhoneNumber: "+54 9 3704 777777" };
  const seller = resolveWhatsAppActor("+54 9 3704 868421", identities);
  assert.equal(seller, "seller");
  assert.equal(shouldCaptureLead(seller), false);
  assert.equal(resolveWhatsAppActor("5493704777777", identities), "delivery");
  assert.equal(shouldCaptureLead(resolveWhatsAppActor("5493704555555", identities)), true);
});

test("buffer replaces persisted incoming turns once and preserves preceding context", () => {
  const history = [
    { role: "assistant", content: "¿Qué te preparo?", platformMessageId: "reply" },
    { role: "user", content: "foto", platformMessageId: "one" },
    { role: "user", content: "dos", platformMessageId: "two" },
  ];
  assert.deepEqual(mergeBufferedTurn(history, [
    { content: "[imagen analizada]", messageId: "one" },
    { content: "dos", messageId: "two" },
  ]), [
    { role: "assistant", content: "¿Qué te preparo?" },
    { role: "user", content: "[imagen analizada]\ndos" },
  ]);
});

test("a repeated older turn is retained when only the newest buffered turn matches", () => {
  const history = [
    { role: "user", content: "dale" },
    { role: "assistant", content: "¿algo más?" },
    { role: "user", content: "dale" },
  ];
  assert.deepEqual(mergeBufferedTurn(history, [{ content: "dale" }]), [
    { role: "user", content: "dale" }, { role: "assistant", content: "¿algo más?" },
    { role: "user", content: "dale" },
  ]);
});

test("orders reject missing DB prices and invalid quantities before writes", () => {
  const item = { name: "Genesis", quantity: 2, price: 5000, unitPrice: 5000 };
  assert.equal(validateResolvedOrderItems([item]), null);
  assert.match(validateResolvedOrderItems([{ ...item, name: "Producto inventado", unitPrice: 0 }])!, /precio válido/);
  assert.match(validateResolvedOrderItems([{ ...item, quantity: -3 }])!, /Cantidad inválida/);
  assert.match(validateResolvedOrderItems([])!, /al menos un producto/);
  assert.equal(matchCatalog("pan", [{ name: "Pan de hamburguesa 4u" }, { name: "Pan de hamburguesa 12u" }]), undefined);
  assert.equal(matchCatalog("genesis", [{ name: "Genesis" }, { name: "Deli Deli" }])?.name, "Genesis");
});

test("a fuzzy name alone cannot attach a new order to a different customer", () => {
  assert.equal(isSafeCustomerNameMatch("Juan", "Juan Pérez"), true);
  assert.equal(isSafeCustomerNameMatch("maría pérez", "Maria Perez"), true);
  assert.equal(isSafeCustomerNameMatch("María", "Mariana López"), false);
  assert.equal(isSafeCustomerNameMatch("Jo", "Josefina"), false);
});

test("seller cannot broadcast or delete leads and prompts have no static product prices", () => {
  assert.equal("broadcastWhatsApp" in internalSellerTools, false);
  assert.equal("deleteLead" in internalSellerTools, false);
  const seller = readFileSync("src/lib/whatsapp/seller-prompt.ts", "utf8");
  const telegram = INTERNAL_AGENT_SYSTEM_PROMPT;
  assert.doesNotMatch(seller, /\bbroadcastWhatsApp\b|\bdeleteLead\b/);
  assert.doesNotMatch(seller, /\$\d[\d.]*\s*(?:c\/u|\)|\s*->)/);
  assert.doesNotMatch(telegram, /\$\d[\d.]*/);
  assert.match(telegram, /confirmación explícita/);
});

test("customer toolset does not expose a confirmation that consumes the cart prematurely", () => {
  const agent = readFileSync("src/lib/whatsapp/agent.ts", "utf8");
  assert.doesNotMatch(agent, /confirmOrder:\s*createConfirmOrderTool/);
});
