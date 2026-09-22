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
import {
  classifyBoundary,
  createInitialSessionState,
  assertSessionContext,
  toSessionContext,
  transitionSession,
  SessionPolicyService,
  type ConversationSessionState,
  type SessionPolicyRepository,
} from "./whatsapp/session-policy";
import {
  isProtocolArtifact,
  isEligibleInboundMessage,
  resolveSessionPersistence,
} from "./whatsapp/webhook-pipeline";
import {
  HandoffEffectService,
  resolveHandoffDelivery,
  resolveHandoffTransport,
  type HandoffClaimInput,
  type HandoffEffectKind,
  type HandoffEffectRepository,
} from "./whatsapp/human-handoff";
import { formatPermittedSessionFacts } from "./whatsapp/prompt-builder";
import {
  resolveAgentRouting,
  FIXED_ACK_REPLY,
  FIXED_CLARIFICATION_REPLY,
  HANDOFF_REPLY,
} from "./whatsapp/agent";
import {
  getStatusSemantic,
  getStatusNotificationMessage,
  isActiveStatus,
} from "./whatsapp/status-utils";
import type { SessionContext } from "./whatsapp/session-policy";

function makeSessionContext(overrides: Partial<SessionContext>): SessionContext {
  return {
    commercialIntent: null,
    pendingQuestion: null,
    hasActiveOrder: false,
    activeOrderId: null,
    hasActiveCart: false,
    hasAddressReference: false,
    recentAssetKinds: [],
    ...overrides,
  };
}

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

test("commercial session state resumes without relying on the 20-turn history window", () => {
  const previous: ConversationSessionState = {
    conversationId: 41,
    version: 7,
    policyVersion: 1,
    episode: 0,
    mode: "commercial",
    ackSent: false,
    clarificationSent: false,
    commercialIntent: "order",
    pendingQuestion: "delivery_time",
    hasActiveOrder: true,
    activeOrderId: null,
    hasActiveCart: false,
    hasAddressReference: false,
    recentAssetKinds: ["image"],
  };

  const decision = transitionSession(previous, {
    signal: classifyBoundary({ text: "¿llega hoy el pedido?", messageType: "text", hasActiveOrder: true }),
    messageId: "inbound-41",
  });

  assert.equal(decision.kind, "allow_agent");
  assert.deepEqual(toSessionContext(decision.state), {
    commercialIntent: "order",
    pendingQuestion: "delivery_time",
    hasActiveOrder: true,
    hasActiveCart: false,
    hasAddressReference: false,
    recentAssetKinds: ["image"],
  });
});

test("session transitions stay isolated and persist no message text", () => {
  const first = transitionSession(createInitialSessionState(101), {
    signal: "commercial",
    messageId: "message-101",
    commercialFacts: { intent: "catalog", recentAssetKinds: ["document"] },
  });
  const second = transitionSession(createInitialSessionState(202), {
    signal: "personal",
    messageId: "message-202",
  });

  assert.equal(first.state.conversationId, 101);
  assert.equal(first.state.mode, "commercial");
  assert.equal(second.state.conversationId, 202);
  assert.equal(second.kind, "fixed_ack");
  assert.equal("text" in first.state, false);
  assert.equal("phone" in first.state, false);
  assert.equal("name" in first.state, false);
});

test("classifier and state machine keep commercial access conservative", () => {
  assert.equal(classifyBoundary({ text: "quiero hacer un pedido", messageType: "text", hasActiveOrder: false }), "commercial");
  assert.equal(classifyBoundary({ text: "hola, ¿cómo estás?", messageType: "text", hasActiveOrder: false }), "personal");
  assert.equal(classifyBoundary({ text: "buenas", messageType: "text", hasActiveOrder: false }), "ambiguous");

  const ambiguous = transitionSession(createInitialSessionState(7), { signal: "ambiguous", messageId: "ambiguous-7" });
  const personal = transitionSession(createInitialSessionState(8), { signal: "personal", messageId: "personal-8" });
  const recurrence = transitionSession(personal.state, { signal: "personal", messageId: "personal-9" });
  const override = transitionSession(createInitialSessionState(9), {
    signal: "commercial",
    messageId: "order-9",
    hasHumanOverride: true,
  });

  assert.equal(ambiguous.kind, "fixed_clarification");
  assert.equal(ambiguous.state.clarificationSent, true);
  assert.equal(personal.kind, "fixed_ack");
  assert.equal(recurrence.kind, "handoff");
  assert.equal(override.kind, "blocked");
  assert.equal(override.reason, "override");
  assert.equal(override.state.mode, "commercial");
});

test("ambiguous input receives one clarification before a deterministic handoff", () => {
  const initial = createInitialSessionState(12);
  const clarification = transitionSession(initial, { signal: "ambiguous", messageId: "ambiguous-12-1" });

  assert.equal(clarification.kind, "fixed_clarification");
  assert.equal(clarification.state.clarificationSent, true);
  assert.equal(clarification.state.mode, "commercial");

  const handoff = transitionSession(clarification.state, { signal: "ambiguous", messageId: "ambiguous-12-2" });
  assert.equal(handoff.kind, "handoff");
  assert.equal(handoff.state.mode, "handed_off");
});

test("commercial input resets the episode flags without releasing an existing handoff", () => {
  const personal = transitionSession(createInitialSessionState(13), { signal: "personal", messageId: "personal-13-1" });
  const resumed = transitionSession(personal.state, { signal: "commercial", messageId: "commercial-13-1" });
  const laterPersonal = transitionSession(resumed.state, { signal: "personal", messageId: "personal-13-2" });

  assert.equal(resumed.state.ackSent, false);
  assert.equal(resumed.state.clarificationSent, false);
  assert.equal(laterPersonal.kind, "fixed_ack");

  const held = transitionSession(personal.state, { signal: "personal", messageId: "personal-13-3" });
  const blocked = transitionSession(held.state, { signal: "commercial", messageId: "commercial-13-2" });
  assert.equal(blocked.kind, "blocked");
  assert.equal(blocked.state.mode, "handed_off");
});

test("session context accepts bounded commercial facts and rejects PII or payloads", () => {
  assert.deepEqual(assertSessionContext({
    commercialIntent: "order",
    pendingQuestion: "delivery_time",
    hasActiveOrder: true,
    recentAssetKinds: ["image"],
    activeOrderId: 55,
    hasAddressReference: true,
  }), {
    commercialIntent: "order",
    pendingQuestion: "delivery_time",
    hasActiveOrder: true,
    recentAssetKinds: ["image"],
    activeOrderId: 55,
    hasAddressReference: true,
  });

  for (const invalid of [
    { text: "customer message" },
    { phone: "+5491112345678" },
    { customerName: "Ana" },
    { address: "Calle 123" },
    { paymentMethod: "transfer" },
    { prompt: "system instructions" },
    { mediaPayload: { url: "https://example.test/file" } },
  ]) {
    assert.throws(() => assertSessionContext(invalid), /not permitted/i);
  }
});

test("session migration defines minimal versioned tables without durable message content", () => {
  const schema = readFileSync("src/db/schema.ts", "utf8");
  const migration = readFileSync("drizzle/0003_session_memory.sql", "utf8");

  assert.match(schema, /conversationSessionStates/);
  assert.match(schema, /conversationSessionEvents/);
  assert.match(schema, /conversationSessionEffectClaims/);
  assert.match(migration, /conversation_session_states/);
  assert.match(migration, /UNIQUE \("conversation_id"\)/);
  assert.match(migration, /UNIQUE \("conversation_id", "inbound_message_id"\)/);
  assert.doesNotMatch(migration, /\b(message_text|phone|customer_name|address_value|payment_value|prompt|media_payload)\b/i);
});

test("protocol artifacts never cause lookup, mutation, routing, or reply", () => {
  assert.equal(
    isProtocolArtifact({ type: "whatsapp.message.echo", whatsappMessage: {} }),
    true
  );
  assert.equal(
    isProtocolArtifact({
      type: "whatsapp.inbound_message.received",
      whatsappInboundMessage: { type: "status", id: "status-1" },
    }),
    true
  );
  assert.equal(isProtocolArtifact({ type: "whatsapp.delivery.status" }), true);
  assert.equal(
    isProtocolArtifact({ type: "whatsapp.message.status_update" }),
    true
  );

  assert.equal(
    isProtocolArtifact({
      type: "whatsapp.inbound_message.received",
      whatsappInboundMessage: {
        type: "text",
        id: "eligible-1",
        from: "+5493704000001",
        text: { body: "quiero hacer un pedido" },
      },
    }),
    false
  );
  assert.equal(
    isProtocolArtifact({
      type: "whatsapp.inbound_message.received",
      whatsappInboundMessage: {
        type: "image",
        id: "eligible-2",
        from: "+5493704000002",
        image: { id: "media-1", caption: "foto del menu" },
      },
    }),
    false
  );
});

test("only eligible customer input reaches session persistence", () => {
  assert.equal(
    isEligibleInboundMessage({
      type: "text",
      id: "eligible-1",
      from: "+5493704000001",
      text: { body: "quiero hacer un pedido" },
    }),
    true
  );
  assert.equal(
    isEligibleInboundMessage({
      type: "image",
      id: "eligible-2",
      from: "+5493704000002",
      image: { id: "media-1" },
    }),
    true
  );

  assert.equal(
    isEligibleInboundMessage({ type: "text", id: "empty-1", from: "+5493704000003", text: { body: "   " } }),
    false
  );
  assert.equal(isEligibleInboundMessage({ type: "status", id: "status-1" }), false);
  assert.equal(
    isEligibleInboundMessage({ type: "text", id: "", from: "+5493704000004", text: { body: "hola" } }),
    false
  );
  assert.equal(
    isEligibleInboundMessage({ type: "text", id: "no-from-1", text: { body: "hola" } }),
    false
  );
});

test("webhook persists eligible transitions with AI disabled and suppresses outputs", () => {
  const disabled = resolveSessionPersistence({
    eligible: true,
    aiEnabled: false,
    dedup: "new",
    cas: "saved",
  });
  assert.equal(disabled.persistSession, true);
  assert.equal(disabled.allowBuffer, false);
  assert.equal(disabled.allowAgent, false);
  assert.equal(disabled.allowReply, false);
  assert.equal(disabled.failClosed, false);

  const enabled = resolveSessionPersistence({
    eligible: true,
    aiEnabled: true,
    dedup: "new",
    cas: "saved",
  });
  assert.equal(enabled.persistSession, true);
  assert.equal(enabled.allowBuffer, true);
  assert.equal(enabled.allowAgent, true);

  const artifact = resolveSessionPersistence({
    eligible: false,
    aiEnabled: false,
    dedup: "new",
    cas: "saved",
  });
  assert.equal(artifact.persistSession, false);
  assert.equal(artifact.allowBuffer, false);
  assert.equal(artifact.allowAgent, false);
  assert.equal(artifact.allowReply, false);

  const dedupFailed = resolveSessionPersistence({
    eligible: true,
    aiEnabled: false,
    dedup: "failed",
    cas: "saved",
  });
  assert.equal(dedupFailed.failClosed, true);
  assert.equal(dedupFailed.persistSession, false);
  assert.equal(dedupFailed.allowBuffer, false);
  assert.equal(dedupFailed.allowAgent, false);
  assert.equal(dedupFailed.allowReply, false);

  const casConflict = resolveSessionPersistence({
    eligible: true,
    aiEnabled: true,
    dedup: "new",
    cas: "conflict",
  });
  assert.equal(casConflict.failClosed, true);
  assert.equal(casConflict.allowBuffer, false);
  assert.equal(casConflict.allowAgent, false);
  assert.equal(casConflict.allowReply, false);
});

test("retry and concurrent delivery mutate session state exactly once", async () => {
  const saved: { inboundMessageId: string; version: number }[] = [];
  const seen = new Set<string>();
  const events = new Map<string, { eventType: "commercial_detected" | "personal_acknowledged" | "ambiguous_clarified" | "handoff_requested"; signal: "commercial" | "personal" | "ambiguous" }>();
  let stored = createInitialSessionState(501);

  const repository: SessionPolicyRepository = {
    async withConversationLock<T>(_conversationId: number, work: () => Promise<T>): Promise<T> {
      return work();
    },
    async load(): Promise<ConversationSessionState | null> {
      return stored;
    },
    async findEvent(_conversationId: number, inboundMessageId: string) {
      return events.get(inboundMessageId) ?? null;
    },
    async saveTransition(input): Promise<"saved" | "duplicate" | "conflict"> {
      if (seen.has(input.inboundMessageId)) return "duplicate";
      seen.add(input.inboundMessageId);
      events.set(input.inboundMessageId, { eventType: input.eventType, signal: input.signal });
      saved.push({ inboundMessageId: input.inboundMessageId, version: input.state.version });
      stored = input.state;
      return "saved";
    },
  };

  const service = new SessionPolicyService(repository);
  const first = await service.decide(501, { signal: "personal", messageId: "retry-501" });
  assert.equal(first.kind, "fixed_ack");

  const retry = await service.decide(501, { signal: "personal", messageId: "retry-501" });
  assert.equal(retry.kind, "duplicate");
  assert.equal(
    saved.filter((entry) => entry.inboundMessageId === "retry-501").length,
    1
  );

  const concurrent = await Promise.all([
    service.decide(501, { signal: "ambiguous", messageId: "concurrent-501" }),
    service.decide(501, { signal: "ambiguous", messageId: "concurrent-501" }),
  ]);
  assert.equal(concurrent.length, 2);
  assert.equal(
    saved.filter((entry) => entry.inboundMessageId === "concurrent-501").length,
    1
  );
  assert.ok(
    concurrent.some((decision) => decision.kind === "duplicate"),
    "concurrent duplicate delivery must resolve as a no-op"
  );
});

test("dedup and CAS failures fail closed without routing or output", async () => {
  const failingDedup: SessionPolicyRepository = {
    async withConversationLock<T>(_conversationId: number, work: () => Promise<T>): Promise<T> {
      return work();
    },
    async load(): Promise<ConversationSessionState | null> {
      return createInitialSessionState(502);
    },
    async findEvent(): Promise<null> {
      return null;
    },
    async saveTransition(): Promise<"saved" | "duplicate" | "conflict"> {
      throw new Error("dedup unavailable");
    },
  };

  await assert.rejects(
    () => new SessionPolicyService(failingDedup).decide(502, { signal: "commercial", messageId: "fail-502" }),
    /dedup unavailable/i
  );

  const conflicting: SessionPolicyRepository = {
    async withConversationLock<T>(_conversationId: number, work: () => Promise<T>): Promise<T> {
      return work();
    },
    async load(): Promise<ConversationSessionState | null> {
      return createInitialSessionState(503);
    },
    async findEvent(): Promise<null> {
      return null;
    },
    async saveTransition(): Promise<"saved" | "duplicate" | "conflict"> {
      return "conflict";
    },
  };

  await assert.rejects(
    () => new SessionPolicyService(conflicting).decide(503, { signal: "commercial", messageId: "conflict-503" }),
    /compare-and-swap conflict/i
  );

  const closed = resolveSessionPersistence({
    eligible: true,
    aiEnabled: true,
    dedup: "failed",
    cas: "saved",
  });
  assert.equal(closed.failClosed, true);
  assert.equal(closed.persistSession, false);
  assert.equal(closed.allowAgent, false);
  assert.equal(closed.allowReply, false);
});

test("webhook orders protocol filter before lookup and session before agent", () => {
  const route = readFileSync("src/app/api/whatsapp/webhook/route.ts", "utf8");
  const post = route.slice(route.indexOf("export async function POST"));
  assert.ok(post.length > 0, "webhook must define POST");
  const protocolGate =
    post.indexOf("isProtocolArtifact(payload)");
  const lookup = post.indexOf("findOrCreateConversation(");
  const dedup = post.indexOf("isMessageDuplicate(");
  const sessionDecide = Math.min(
    ...["await persistSessionTransition(", "sessionPolicyService.decide(", "sessionService.decide("].map((marker) =>
      post.indexOf(marker) === -1 ? Number.POSITIVE_INFINITY : post.indexOf(marker)
    )
  );
  const buffer = Math.min(
    post.indexOf("BufferManager.enqueue(") === -1 ? Number.POSITIVE_INFINITY : post.indexOf("BufferManager.enqueue("),
    post.indexOf("scheduleBufferProcessing(") === -1 ? Number.POSITIVE_INFINITY : post.indexOf("scheduleBufferProcessing(")
  );
  const agent = Math.min(
    post.indexOf("runWhatsAppAgent(") === -1 ? Number.POSITIVE_INFINITY : post.indexOf("runWhatsAppAgent("),
    post.indexOf("generateText(") === -1 ? Number.POSITIVE_INFINITY : post.indexOf("generateText(")
  );

  assert.ok(protocolGate !== -1, "webhook must call the protocol-artifact gate");
  assert.ok(lookup !== -1 && dedup !== -1 && sessionDecide !== Number.POSITIVE_INFINITY);
  assert.ok(protocolGate < lookup, "protocol filter must run before conversation lookup");
  assert.ok(dedup < sessionDecide, "durable dedup must run before session persistence");
  assert.ok(sessionDecide < buffer, "session persistence must run before buffering");
  assert.ok(sessionDecide < agent, "session persistence must run before GPT/agent");
  assert.match(post, /AI disabled/);
  assert.match(post, /fail closed/i);
});

function createFakeHandoffRepository() {
  const episodeKeys = new Set<string>();
  const inboundKeys = new Set<string>();
  const records: {
    conversationId: number;
    episode: number;
    effectKind: HandoffEffectKind;
    inboundMessageId: string;
  }[] = [];
  let calls = 0;
  const repository: HandoffEffectRepository = {
    async claimEffect(input) {
      calls += 1;
      const episodeKey = `${input.conversationId}:${input.episode}:${input.effectKind}`;
      const inboundKey = `${input.conversationId}:${input.inboundMessageId}:${input.effectKind}`;
      if (episodeKeys.has(episodeKey) || inboundKeys.has(inboundKey)) return "duplicate";
      episodeKeys.add(episodeKey);
      inboundKeys.add(inboundKey);
      records.push({ ...input });
      return "claimed";
    },
  };
  return { repository, records, calls: () => calls };
}

test("handoff effects are claimed exactly once per episode and message", async () => {
  const fake = createFakeHandoffRepository();
  const service = new HandoffEffectService(fake.repository);

  const result = await service.claimHandoffEffects({
    conversationId: 701,
    episode: 3,
    inboundMessageId: "handoff-701-1",
    aiEnabled: true,
  });

  assert.equal(result.overrideClaimed, true);
  assert.equal(result.ownerNotificationClaimed, true);
  assert.equal(result.customerReplyClaimed, true);
  assert.equal(result.customerReplyDeliverable, true);
  assert.equal(result.ownerNotificationDeliverable, true);

  const kinds = fake.records.map((record) => record.effectKind).sort();
  assert.deepEqual(kinds, ["customer_reply", "human_override", "owner_notification"]);
  for (const record of fake.records) {
    assert.deepEqual(Object.keys(record).sort(), [
      "conversationId",
      "effectKind",
      "episode",
      "inboundMessageId",
    ]);
  }
});

test("retry and concurrent handoff delivery claim no additional effect", async () => {
  const fake = createFakeHandoffRepository();
  const service = new HandoffEffectService(fake.repository);
  let ownerNotifications = 0;
  let customerReplies = 0;
  const deliver = (result: { ownerNotificationDeliverable: boolean; customerReplyDeliverable: boolean }) => {
    if (result.ownerNotificationDeliverable) ownerNotifications += 1;
    if (result.customerReplyDeliverable) customerReplies += 1;
  };

  const input: HandoffClaimInput = {
    conversationId: 702,
    episode: 1,
    inboundMessageId: "handoff-702-1",
    aiEnabled: true,
  };
  deliver(await service.claimHandoffEffects(input));

  const retry = await service.claimHandoffEffects(input);
  assert.equal(retry.overrideClaimed, false);
  assert.equal(retry.ownerNotificationClaimed, false);
  assert.equal(retry.customerReplyClaimed, false);
  assert.equal(retry.customerReplyDeliverable, false);
  assert.equal(retry.ownerNotificationDeliverable, false);
  deliver(retry);

  const concurrent = await Promise.all([
    service.claimHandoffEffects(input),
    service.claimHandoffEffects(input),
  ]);
  for (const outcome of concurrent) {
    assert.equal(outcome.overrideClaimed, false);
    assert.equal(outcome.customerReplyClaimed, false);
  }
  for (const outcome of concurrent) deliver(outcome);

  assert.equal(
    fake.records.filter((record) => record.inboundMessageId === "handoff-702-1").length,
    3
  );
  assert.equal(ownerNotifications, 1);
  assert.equal(customerReplies, 1);
});

test("a different inbound in the same episode cannot claim handoff effects twice", async () => {
  const fake = createFakeHandoffRepository();
  const service = new HandoffEffectService(fake.repository);

  const first = await service.claimHandoffEffects({
    conversationId: 703,
    episode: 2,
    inboundMessageId: "handoff-703-1",
    aiEnabled: true,
  });
  assert.equal(first.overrideClaimed, true);

  const second = await service.claimHandoffEffects({
    conversationId: 703,
    episode: 2,
    inboundMessageId: "handoff-703-2",
    aiEnabled: true,
  });
  assert.equal(second.overrideClaimed, false);
  assert.equal(second.ownerNotificationClaimed, false);
  assert.equal(second.customerReplyClaimed, false);
  assert.equal(fake.records.length, 3);
});

test("a new episode may claim handoff effects again", async () => {
  const fake = createFakeHandoffRepository();
  const service = new HandoffEffectService(fake.repository);

  const first = await service.claimHandoffEffects({
    conversationId: 704,
    episode: 4,
    inboundMessageId: "handoff-704-1",
    aiEnabled: true,
  });
  const next = await service.claimHandoffEffects({
    conversationId: 704,
    episode: 5,
    inboundMessageId: "handoff-704-2",
    aiEnabled: true,
  });

  assert.equal(first.overrideClaimed, true);
  assert.equal(next.overrideClaimed, true);
  assert.equal(next.ownerNotificationClaimed, true);
  assert.equal(next.customerReplyClaimed, true);
  assert.equal(fake.records.length, 6);
});

test("handoff claims persist while customer delivery is suppressed when AI is disabled", async () => {
  const fake = createFakeHandoffRepository();
  const service = new HandoffEffectService(fake.repository);

  const result = await service.claimHandoffEffects({
    conversationId: 705,
    episode: 0,
    inboundMessageId: "handoff-705-1",
    aiEnabled: false,
  });

  assert.equal(result.overrideClaimed, true);
  assert.equal(result.ownerNotificationClaimed, true);
  assert.equal(result.customerReplyClaimed, true);
  assert.equal(result.customerReplyDeliverable, false);
  assert.equal(result.ownerNotificationDeliverable, true);

  assert.equal(resolveHandoffDelivery({ aiEnabled: true, replyClaimed: true }), true);
  assert.equal(resolveHandoffDelivery({ aiEnabled: false, replyClaimed: true }), false);
  assert.equal(resolveHandoffDelivery({ aiEnabled: true, replyClaimed: false }), false);
  assert.equal(resolveHandoffDelivery({ aiEnabled: false, replyClaimed: false }), false);
});

test("session policy claims handoff effects once and suppresses duplicate retries", async () => {
  const saved: string[] = [];
  const seen = new Set<string>();
  let stored = createInitialSessionState(706);
  const repository: SessionPolicyRepository = {
    async withConversationLock<T>(_conversationId: number, work: () => Promise<T>): Promise<T> {
      return work();
    },
    async load(): Promise<ConversationSessionState | null> {
      return stored;
    },
    async findEvent(_conversationId: number, inboundMessageId: string) {
      return seen.has(inboundMessageId)
        ? { eventType: "handoff_requested" as const, signal: "personal" as const }
        : null;
    },
    async saveTransition(input): Promise<"saved" | "duplicate" | "conflict"> {
      if (seen.has(input.inboundMessageId)) return "duplicate";
      seen.add(input.inboundMessageId);
      saved.push(input.inboundMessageId);
      stored = input.state;
      return "saved";
    },
  };

  const claims: HandoffClaimInput[] = [];
  const claimant = {
    async claimHandoffEffects(input: HandoffClaimInput) {
      claims.push(input);
      return {
        overrideClaimed: true,
        ownerNotificationClaimed: true,
        customerReplyClaimed: true,
        customerReplyDeliverable: input.aiEnabled,
        ownerNotificationDeliverable: true,
      };
    },
  };

  const service = new SessionPolicyService(repository, claimant);
  const first = await service.decide(706, { signal: "personal", messageId: "ack-706" });
  assert.equal(first.kind, "fixed_ack");
  assert.equal(claims.length, 0);

  const handoff = await service.decide(706, { signal: "personal", messageId: "handoff-706" });
  assert.equal(handoff.kind, "handoff");
  if (handoff.kind !== "handoff") throw new Error("expected handoff decision");
  assert.equal(handoff.notifyClaim, true);
  assert.equal(handoff.replyClaim, true);
  assert.equal(handoff.delivery, "allowed");
  assert.equal(claims.length, 1);
  assert.deepEqual(claims[0], {
    conversationId: 706,
    episode: handoff.state.episode,
    inboundMessageId: "handoff-706",
    aiEnabled: true,
  });
  assert.equal(saved.filter((id) => id === "handoff-706").length, 1);

  const retry = await service.decide(706, { signal: "personal", messageId: "handoff-706" });
  assert.equal(retry.kind, "duplicate");
  assert.equal(claims.length, 1);
  assert.equal(saved.filter((id) => id === "handoff-706").length, 1);

  const blocked = await service.decide(706, {
    signal: "commercial",
    messageId: "blocked-706",
    hasHumanOverride: true,
  });
  assert.equal(blocked.kind, "blocked");
  assert.equal(claims.length, 1);
});

test("handoff decision suppresses customer delivery while AI is disabled", () => {
  const ack = transitionSession(createInitialSessionState(707), { signal: "personal", messageId: "ack-707" });
  const disabled = transitionSession(ack.state, {
    signal: "personal",
    messageId: "handoff-707",
    delivery: "suppressed",
  });
  assert.equal(disabled.kind, "handoff");
  if (disabled.kind !== "handoff") throw new Error("expected handoff decision");
  assert.equal(disabled.delivery, "suppressed");
  assert.equal(disabled.notifyClaim, false);
  assert.equal(disabled.replyClaim, false);

  const allowed = transitionSession(ack.state, { signal: "personal", messageId: "handoff-707b" });
  assert.equal(allowed.kind, "handoff");
  if (allowed.kind !== "handoff") throw new Error("expected handoff decision");
  assert.equal(allowed.delivery, "allowed");
});

test("transfer tool delegates effects to the shared handoff service", () => {
  const source = readFileSync("src/lib/whatsapp/tools/transfer-to-human.ts", "utf8");
  assert.match(source, /human-handoff/);
  assert.match(source, /claimHandoffEffects/);
  const claim = source.indexOf("claimHandoffEffects(");
  const notify = source.indexOf("sendEscalationEmail(");
  assert.ok(claim !== -1 && notify !== -1, "tool must claim before notifying");
  assert.ok(claim < notify, "handoff claim must precede owner notification");
});

test("handoff and blocked paths never invoke GPT or tools", () => {
  const route = readFileSync("src/app/api/whatsapp/webhook/route.ts", "utf8");
  const post = route.slice(route.indexOf("export async function POST"));
  assert.ok(post.length > 0, "webhook must define POST");
  const guard = post.indexOf('sessionDecision.kind === "blocked"');
  assert.ok(guard !== -1, "webhook must guard blocked/handoff decisions");
  assert.match(post, /sessionDecision\.kind === "handoff"/);
  const agent = Math.min(
    post.indexOf("runWhatsAppAgent(") === -1 ? Number.POSITIVE_INFINITY : post.indexOf("runWhatsAppAgent("),
    post.indexOf("generateText(") === -1 ? Number.POSITIVE_INFINITY : post.indexOf("generateText(")
  );
  const buffer = post.indexOf("BufferManager.enqueue(");
  assert.ok(agent !== Number.POSITIVE_INFINITY, "webhook must invoke the agent on allowed paths");
  assert.ok(buffer !== -1, "webhook must enqueue allowed paths");
  assert.ok(guard < buffer, "blocked/handoff guard must run before buffering");
  assert.ok(guard < agent, "blocked/handoff guard must run before GPT/agent");
  assert.match(post.slice(guard, guard + 600), /return NextResponse/);
});

test("LLM context accepts only permitted compact non-text commercial facts", () => {
  const facts = formatPermittedSessionFacts(makeSessionContext({
    commercialIntent: "order",
    pendingQuestion: "delivery_time",
    hasActiveOrder: true,
    activeOrderId: 12,
    hasActiveCart: false,
    hasAddressReference: true,
    recentAssetKinds: ["image"],
  }));
  assert.equal(
    facts,
    "SESIÓN: intent=order pending=delivery_time order=yes#12 cart=no address=yes assets=image"
  );
  assert.doesNotMatch(facts, /549|hola|neuquen|alias|@|\+/i);

  assert.equal(formatPermittedSessionFacts(makeSessionContext({})), "");
  assert.equal(
    formatPermittedSessionFacts(makeSessionContext({ commercialIntent: "support" })),
    "SESIÓN: intent=support order=no cart=no address=no assets=none"
  );

  for (const forbidden of [
    { text: "quiero una bookbinder" },
    { phone: "+5493704000001" },
    { customerName: "Ana" },
    { address: "Neuquen 1245" },
    { paymentMethod: "transfer" },
    { prompt: "sos Karen" },
    { mediaPayload: { url: "https://example.test/x" } },
  ]) {
    assert.throws(() => formatPermittedSessionFacts(forbidden as never), /not permitted/i);
  }
});

test("fixed, handoff, blocked and duplicate paths never reach LLM or tools", () => {
  const allowed = resolveAgentRouting("allow_agent");
  assert.equal(allowed.invokeLLM, true);
  assert.equal(allowed.useTools, true);
  assert.equal(allowed.fixedReply, null);

  const ack = resolveAgentRouting("fixed_ack");
  assert.equal(ack.invokeLLM, false);
  assert.equal(ack.useTools, false);
  assert.equal(ack.fixedReply, FIXED_ACK_REPLY);
  assert.match(FIXED_ACK_REPLY, /todo bien/);

  const clarification = resolveAgentRouting("fixed_clarification");
  assert.equal(clarification.invokeLLM, false);
  assert.equal(clarification.useTools, false);
  assert.equal(clarification.fixedReply, FIXED_CLARIFICATION_REPLY);
  assert.match(FIXED_CLARIFICATION_REPLY, /negocio/);

  const handoff = resolveAgentRouting("handoff");
  assert.equal(handoff.invokeLLM, false);
  assert.equal(handoff.useTools, false);
  assert.equal(handoff.fixedReply, HANDOFF_REPLY);
  assert.match(HANDOFF_REPLY, /Leandro/);

  for (const silent of ["blocked", "duplicate"] as const) {
    const decision = resolveAgentRouting(silent);
    assert.equal(decision.invokeLLM, false);
    assert.equal(decision.useTools, false);
    assert.equal(decision.fixedReply, null);
  }
});

test("agent guards routing before GPT and prompt builder validates session facts", () => {
  const agent = readFileSync("src/lib/whatsapp/agent.ts", "utf8");
  assert.match(agent, /resolveAgentRouting/);
  assert.match(agent, /SessionContext/);
  const guard = agent.indexOf("resolveAgentRouting(");
  const llm = agent.indexOf("generateText(");
  assert.ok(guard !== -1 && llm !== -1 && guard < llm, "routing guard must precede GPT");

  const builder = readFileSync("src/lib/whatsapp/prompt-builder.ts", "utf8");
  assert.match(builder, /formatPermittedSessionFacts/);
  assert.match(builder, /assertSessionContext/);
});

test("N1 price-only inquiry creates no cart or order", () => {
  const signal = classifyBoundary({ text: "¿qué precio tiene la crispy?", messageType: "text", hasActiveOrder: false });
  assert.equal(signal, "commercial");
  const decision = transitionSession(createInitialSessionState(801), {
    signal,
    messageId: "n1-1",
    commercialFacts: { intent: "catalog" },
  });
  assert.equal(decision.kind, "allow_agent");
  if (decision.kind !== "allow_agent") throw new Error("expected allow_agent");
  const facts = toSessionContext(decision.state);
  assert.equal(facts.hasActiveOrder, false);
  assert.equal(facts.hasActiveCart, false);
  assert.ok(facts.activeOrderId == null);
  assert.equal(resolveAgentRouting("allow_agent").invokeLLM, true);

  const agent = readFileSync("src/lib/whatsapp/agent.ts", "utf8");
  assert.match(agent, /getProductPrice/);

  // Triangulate: phrasing without a catalog keyword takes the ambiguous path —
  // one fixed clarification, still no cart, no order, no LLM.
  assert.equal(
    classifyBoundary({ text: "¿cuánto sale la bookbinder?", messageType: "text", hasActiveOrder: false }),
    "ambiguous"
  );
  const clarification = transitionSession(createInitialSessionState(811), {
    signal: "ambiguous",
    messageId: "n1-2",
  });
  assert.equal(clarification.kind, "fixed_clarification");
  assert.equal(resolveAgentRouting("fixed_clarification").invokeLLM, false);
});

test("N2 unit-vs-dozen question is asked once", () => {
  const first = transitionSession(createInitialSessionState(802), {
    signal: "commercial",
    messageId: "n2-1",
    commercialFacts: { intent: "order", pendingQuestion: "unit_or_dozen" },
  });
  assert.equal(first.kind, "allow_agent");
  if (first.kind !== "allow_agent") throw new Error("expected allow_agent");
  assert.equal(first.state.pendingQuestion, "unit_or_dozen");
  assert.match(formatPermittedSessionFacts(toSessionContext(first.state)), /pending=unit_or_dozen/);

  const second = transitionSession(first.state, {
    signal: "commercial",
    messageId: "n2-2",
    commercialFacts: { intent: "order", pendingQuestion: "unit_or_dozen" },
  });
  assert.equal(second.kind, "allow_agent");
  if (second.kind !== "allow_agent") throw new Error("expected allow_agent");
  assert.equal(second.state.pendingQuestion, "unit_or_dozen");
  assert.equal(second.state.version, first.state.version + 1);
});

test("N3 joke quantity 100 is never registered", () => {
  const context = makeSessionContext({ commercialIntent: "order" });
  assert.equal("quantity" in context, false);
  assert.doesNotMatch(formatPermittedSessionFacts(context), /100/);

  const prompt = readFileSync("src/lib/whatsapp/prompt-builder.ts", "utf8");
  assert.match(prompt, /100 te hago/);

  const decision = transitionSession(createInitialSessionState(803), { signal: "commercial", messageId: "n3-1" });
  assert.equal(decision.kind, "allow_agent");
  if (decision.kind !== "allow_agent") throw new Error("expected allow_agent");
  assert.equal("quantity" in toSessionContext(decision.state), false);
});

test("N4 post-delivery reply clarifies instead of opening an order", () => {
  const semantic = getStatusSemantic("delivered", "hamburguesas", "Neuquen 1245", 44);
  assert.match(semantic, /ENTREGADO/);
  assert.match(semantic, /No es un pedido activo/);
  assert.equal(isActiveStatus("delivered"), false);

  const notification = getStatusNotificationMessage("delivered", 44, "hamburguesas", "Neuquen 1245");
  assert.ok(notification && notification.includes("Gracias por elegirnos"));

  assert.equal(isActiveStatus("ready"), true);
  assert.match(getStatusSemantic("ready", "hamburguesas", null, 45), /LISTO/);
});

test("N5 post-handoff input stays blocked without LLM or tools", () => {
  const acknowledged = transitionSession(createInitialSessionState(805), { signal: "personal", messageId: "n5-1" });
  const handoff = transitionSession(acknowledged.state, { signal: "personal", messageId: "n5-2" });
  assert.equal(handoff.kind, "handoff");

  const blocked = transitionSession(handoff.state, { signal: "commercial", messageId: "n5-3" });
  assert.equal(blocked.kind, "blocked");
  if (blocked.kind !== "blocked") throw new Error("expected blocked");
  assert.equal(blocked.reason, "handed_off");

  const routing = resolveAgentRouting("blocked");
  assert.equal(routing.invokeLLM, false);
  assert.equal(routing.useTools, false);
  assert.equal(routing.fixedReply, null);
});

test("N6 lower payment is never accepted from memory", () => {
  for (const rejected of [{ paymentMethod: "transfer" }, { total: 5000 }, { alias: "LEA..LEMON" }]) {
    assert.throws(() => assertSessionContext(rejected), /not permitted/i);
  }

  const agent = readFileSync("src/lib/whatsapp/agent.ts", "utf8");
  assert.match(agent, /getPaymentAlias/);

  const facts = formatPermittedSessionFacts(makeSessionContext({
    commercialIntent: "order",
    hasActiveOrder: true,
    activeOrderId: 7,
  }));
  assert.doesNotMatch(facts, /5000|alias|lemon/i);
});

test("N7 closed-hours B2C and B2B contract is preserved", () => {
  const prompt = readFileSync("src/lib/whatsapp/prompt-builder.ts", "utf8");
  assert.match(prompt, /B2B cerrado = createOrder/);
  assert.match(prompt, /B2C cerrado = addOrderItem/);

  assert.equal(isActiveStatus("cancelled"), false);
  assert.equal(isActiveStatus("delivered"), false);
});

test("N8 delay complaint acknowledges with status check and deadline or handoff", () => {
  const signal = classifyBoundary({ text: "hace una hora que espero mi pedido", messageType: "text", hasActiveOrder: true });
  assert.equal(signal, "commercial");
  const decision = transitionSession(createInitialSessionState(808), {
    signal,
    messageId: "n8-1",
    commercialFacts: { intent: "support" },
  });
  assert.equal(decision.kind, "allow_agent");
  if (decision.kind !== "allow_agent") throw new Error("expected allow_agent");
  assert.match(formatPermittedSessionFacts(toSessionContext(decision.state)), /intent=support/);

  const agent = readFileSync("src/lib/whatsapp/agent.ts", "utf8");
  assert.match(agent, /getWaitTime/);

  assert.equal(
    classifyBoundary({ text: "¿cuánto tarda mi pedido?", messageType: "text", hasActiveOrder: true }),
    "commercial"
  );
});

test("W1 fixed paths never reach buffer or GPT and thread routing into the agent", () => {
  const route = readFileSync("src/app/api/whatsapp/webhook/route.ts", "utf8");
  const post = route.slice(route.indexOf("export async function POST"));
  assert.ok(post.length > 0, "webhook must define POST");
  const fixedGuard = post.indexOf('sessionDecision.kind === "fixed_ack"');
  assert.ok(fixedGuard !== -1, "webhook must branch on fixed_ack decisions");
  assert.match(post, /sessionDecision\.kind === "fixed_clarification"/);
  const buffer = post.indexOf("BufferManager.enqueue(");
  const agentCall = post.indexOf("runWhatsAppAgent({");
  assert.ok(buffer !== -1 && fixedGuard < buffer, "fixed guard must run before buffering");
  assert.ok(agentCall !== -1 && fixedGuard < agentCall, "fixed guard must run before the agent");
  assert.ok(
    post.slice(fixedGuard, fixedGuard + 800).includes("return NextResponse"),
    "fixed branch must return before GPT/tools"
  );
  // Commercial path threads boundary routing into the agent; legacy
  // (no session decision) keeps the plain call shape.
  assert.match(post, /routingKind/);
  assert.match(post, /sessionContext/);
  // Pure routing matrix already pins fixed replies without LLM/tools.
  assert.equal(resolveAgentRouting("fixed_ack").invokeLLM, false);
  assert.equal(resolveAgentRouting("fixed_clarification").invokeLLM, false);
  assert.equal(resolveAgentRouting("fixed_ack").fixedReply, FIXED_ACK_REPLY);
  assert.equal(resolveAgentRouting("fixed_clarification").fixedReply, FIXED_CLARIFICATION_REPLY);
  // Triangulate: delivery propagates from the AI gate — suppressed while
  // disabled (silent persist), allowed when enabled (direct fixed reply).
  const suppressedAck = transitionSession(createInitialSessionState(901), {
    signal: "personal",
    messageId: "w1-ack-suppressed",
    delivery: "suppressed",
  });
  assert.equal(suppressedAck.kind, "fixed_ack");
  if (suppressedAck.kind !== "fixed_ack") throw new Error("expected fixed_ack");
  assert.equal(suppressedAck.delivery, "suppressed");
  const allowedClar = transitionSession(createInitialSessionState(902), {
    signal: "ambiguous",
    messageId: "w1-clar-allowed",
    delivery: "allowed",
  });
  assert.equal(allowedClar.kind, "fixed_clarification");
  if (allowedClar.kind !== "fixed_clarification") throw new Error("expected fixed_clarification");
  assert.equal(allowedClar.delivery, "allowed");
});

test("W2 webhook handoff delivers owner transport without customer sends while AI is off", () => {
  // Pure transport gate: owner side is deliverable on a fresh claim;
  // the customer reply may only go out when AI is enabled.
  const claimedEnabled = resolveHandoffTransport({
    notifyClaim: true,
    replyClaim: true,
    delivery: "allowed",
  });
  assert.equal(claimedEnabled.writeOverride, true);
  assert.equal(claimedEnabled.sendOwnerNotification, true);
  assert.equal(claimedEnabled.sendCustomerReply, true);

  const claimedSuppressed = resolveHandoffTransport({
    notifyClaim: true,
    replyClaim: true,
    delivery: "suppressed",
  });
  assert.equal(claimedSuppressed.writeOverride, true);
  assert.equal(claimedSuppressed.sendOwnerNotification, true);
  assert.equal(claimedSuppressed.sendCustomerReply, false);

  const duplicate = resolveHandoffTransport({
    notifyClaim: false,
    replyClaim: false,
    delivery: "allowed",
  });
  assert.equal(duplicate.writeOverride, false);
  assert.equal(duplicate.sendOwnerNotification, false);
  assert.equal(duplicate.sendCustomerReply, false);

  // Webhook handoff branch must perform the minimal transport (override
  // write + owner notification) and never send WhatsApp to the customer.
  const route = readFileSync("src/app/api/whatsapp/webhook/route.ts", "utf8");
  const post = route.slice(route.indexOf("export async function POST"));
  const handoffGuard = post.indexOf('sessionDecision.kind === "handoff"');
  assert.ok(handoffGuard !== -1, "webhook must branch on handoff decisions");
  const handoffBranch = post.slice(handoffGuard, handoffGuard + 1200);
  assert.match(handoffBranch, /deliverWebhookHandoff/);
  assert.match(handoffBranch, /decision: sessionDecision/);
  assert.doesNotMatch(handoffBranch, /sendWhatsAppBubbles|sendWhatsAppMessage/);
  // The transport helper itself writes the 24h override and notifies the
  // owner, with no customer WhatsApp send on any path.
  const helperStart = route.indexOf("async function deliverWebhookHandoff");
  assert.ok(helperStart !== -1, "webhook must define deliverWebhookHandoff");
  const helperEnd = route.indexOf("export async function POST", helperStart);
  const helper = route.slice(helperStart, helperEnd === -1 ? helperStart + 3000 : helperEnd);
  assert.match(helper, /humanOverrideUntil/);
  assert.match(helper, /sendEscalationEmail/);
  assert.doesNotMatch(helper, /sendWhatsAppBubbles|sendWhatsAppMessage/);
});

test("W3 conversation lock documents neon-http limits with CAS plus uniqueness safety", async () => {
  const { DrizzleSessionPolicyRepository } = await import("./whatsapp/session-store");
  const repository = new DrizzleSessionPolicyRepository();
  // Pass-through executes the work inline; CAS on version plus the unique
  // inbound event key carry the real concurrency safety (fail closed).
  assert.equal(await repository.withConversationLock(1, async () => 42), 42);
  // Triangulate: a throwing work unit propagates (fail closed) and a second
  // conversation id executes inline just the same.
  await assert.rejects(repository.withConversationLock(2, async () => {
    throw new Error("w3-boom");
  }), /w3-boom/);
  assert.equal(await repository.withConversationLock(2, async () => "x"), "x");
  const store = readFileSync("src/lib/whatsapp/session-store.ts", "utf8");
  assert.match(store, /neon-http/i);
  assert.match(store, /CAS|compare-and-swap/i);
  assert.match(store, /unique/i);
});

test("W4 human-override check fails closed on DB errors", () => {
  const route = readFileSync("src/app/api/whatsapp/webhook/route.ts", "utf8");
  const guardStart = route.indexOf("async function checkHumanOverride");
  assert.ok(guardStart !== -1, "webhook must define checkHumanOverride");
  const fnEnd = route.indexOf("\n}", guardStart);
  assert.ok(fnEnd !== -1, "checkHumanOverride must be a closed function");
  const fn = route.slice(guardStart, fnEnd);
  const catchAt = fn.indexOf("catch");
  assert.ok(catchAt !== -1, "checkHumanOverride must handle DB errors");
  const catchBlock = fn.slice(catchAt);
  // Fail closed: a DB error must read as "overridden" (AI skipped), never
  // as "no override" (which would let the AI answer over a human).
  assert.match(catchBlock, /return true/);
  assert.doesNotMatch(catchBlock, /return false/);
  // Triangulate: the no-row fast path is preserved (no override row means no
  // override — that is a fact, not an error), only the DB-error path closed.
  assert.match(fn, /humanOverrideUntil/);
  assert.match(fn, /return false/);
});
