# GPT-Live Voice Demo for Muzapp

## Decision

Add voice as a new interaction surface inside the existing Next.js deployment. Do not create a second backend, a Python agent service or a separate Render application for the demo.

Recommended demo path:

- Voice model: `gpt-live-1`.
- Transport: WebRTC from the browser to OpenAI Live.
- Session broker: a new server-side route in this Next.js app.
- Backend delegation: client delegation into the existing agent/business layer.
- Existing text agent: keep AI SDK `generateText` and Zod tools as the source of business behavior.
- Existing data: keep Neon PostgreSQL and Drizzle.
- Existing operations: reuse the current prompt, rate limiting, logs and admin configuration.

The OpenAI Agents SDK is optional. It is not required for this proof. Adding it now would create a second tool and orchestration vocabulary next to the existing AI SDK layer.

## Why this fits the current codebase

Muzapp already has:

- Next.js 16 App Router and server routes.
- `@ai-sdk/openai` and the AI SDK `tool` helper.
- Zod schemas for tool input.
- Drizzle and Neon for products, clients, conversations and orders.
- Agent code in `src/lib/whatsapp/agent.ts`.
- Reusable business tools in `src/lib/whatsapp/tools/`.
- An admin agent configuration surface.
- Rate limiting, prompt injection checks, a circuit-breaker pattern and structured logging.
- A single Render deployment.

The demo should add a voice adapter, not duplicate the business logic.

## Deployment topology

```text
Browser on muzapp.onrender.com
  -> GET/POST /api/live/session on the same Next.js deployment
  -> receives an ephemeral Live credential
  -> WebRTC audio connection to OpenAI Live
  -> data channel carries Live events and transcripts

Same Next.js deployment
  -> authenticates the admin or demo user
  -> creates the Live session with safety identifier
  -> receives or correlates delegated work
  -> calls a small Voice Tool Gateway
  -> reads Neon/Drizzle and existing agent configuration
  -> returns verified concise results
```

The primary OpenAI API key remains a Render environment variable. It must never be sent to the browser.

## What the demo should show

The best first scenario is an owner or staff member speaking to the business agent inside the admin panel:

1. "¿Estamos abiertos ahora?"
2. "¿Qué hamburguesas hay disponibles?"
3. "¿Qué promoción puedo comunicar hoy?"
4. "Armame un borrador de respuesta para un cliente que pregunta por delivery."
5. The agent reads the result aloud and shows the same answer as text.
6. A clearly labeled action remains a draft until the user confirms it visually.

This demonstrates voice, live context, business tools and trust without risking a real order or unsolicited WhatsApp message.

Do not use real customer data in the first demonstration. Use a demo account and synthetic or redacted records.

## Existing tool map

### Safe for the first voice demo

These tools are read-only or low-risk and can be exposed through a voice-specific gateway:

- `checkHours` / `getBusinessHoursTool`
- `getMenu` / `getMenuTool`
- `checkAvailabilityTool`
- `checkDeliveryTool`
- `getDeliveryTimeTool`
- `getActivePromosTool`
- `getProductDetailsTool`
- `getProductPriceTool`
- `checkKitchenStatusTool` when the caller is authorized staff
- `getOrderStatusTool` when an order identifier and user authorization are present

### Proposal-only tools

Wrap these so the first call creates a draft and does not perform the side effect:

- Draft a WhatsApp reply.
- Draft a promotion announcement.
- Draft an order summary.
- Draft a delivery explanation.
- Draft an internal Telegram notification.

### Do not expose directly to voice in the first demo

The current implementation has tools with real effects. For example, `createCreateOrderTool` can insert an order, clear order context, notify Telegram and notify delivery by WhatsApp. Other tools can send media, transfer to a human, modify orders or send external messages.

Do not attach these directly to a voice session:

- `createCreateOrderTool`
- `createConfirmOrderTool`
- `updateOrderTool`
- `cancelOrderTool`
- `createTransferToHumanTool`
- `createSendImageTool`
- `createSendDocumentTool`
- `createSendPromoImageTool`
- Any tool that sends WhatsApp or Telegram externally

If a future demo needs one of them, put it behind a server-side approval record and a visible confirmation button. Voice may request the action; only the server and user approval can execute it.

## Voice Tool Gateway

Do not pass the complete WhatsApp tool registry into Live. Create a separate module conceptually named `voice-tools` with a narrow allow-list.

Each gateway tool should:

- Use a strict Zod input schema.
- Resolve the authenticated operator or demo identity on the server.
- Call an existing business function rather than duplicate SQL.
- Return a small factual result suitable for speech.
- Return a status: `draft`, `completed`, `rejected` or `unknown`.
- Emit a redacted audit event.
- Enforce timeout and rate limits.

Example contract, documented rather than implemented in this task:

```text
voice_get_menu({ category? })
  -> { status: "completed", items: [{ name, price, available }] }

voice_check_hours({})
  -> { status: "completed", isOpen, hours, currentTime }

voice_draft_customer_reply({ customerContext, intent })
  -> { status: "draft", draftText, requiresApproval: true }

voice_confirm_external_action({ approvalId })
  -> { status: "completed" | "rejected", operationId }
```

The speech layer should receive concise facts. Full menus, customer histories and long prompt content stay in the backend or UI.

## Session and permission rules

- Voice starts only after the user presses a visible control.
- The UI shows microphone active, speaking, interrupted and disconnected states.
- The user can pause and end the session.
- The session has a maximum duration for the demo.
- Every session is tied to the signed-in admin or a dedicated demo identity.
- Use a stable privacy-preserving safety identifier derived from the internal user ID.
- Store no raw audio by default.
- Do not put customer phone numbers, addresses or order details into the spoken prompt unless required and authorized.
- Do not announce success until the backend operation has actually succeeded.
- If an action result is unknown, say that it is unknown and do not retry blindly.

## Session route responsibilities

The future route should be responsible for:

1. Authenticate the caller.
2. Check that voice is enabled for the environment.
3. Apply a per-user and global session limit.
4. Create the short-lived Live credential or exchange the WebRTC offer.
5. Pass only a compact prompt and allowed tool policy.
6. Add the safety identifier on the server-side OpenAI request.
7. Return no primary API key to the client.

The route should not execute business mutations merely because the model asked for them. Mutation belongs to the Voice Tool Gateway and approval workflow.

## Cost model

GPT-Live-1 is currently published at **USD 0.05 per minute, billed per second**. The effective rate is approximately **USD 0.000833333 per second**.

| Demo use | Live voice cost |
|---:|---:|
| 60 seconds | USD 0.05 |
| 3 minutes | USD 0.15 |
| 5 minutes | USD 0.25 |
| 20 five-minute demo sessions | USD 5.00 |

This excludes backend model tokens, tool execution, Render, Neon, logs and external messaging costs. A 5-minute voice demo can still be cheap; an always-open session is not a sensible product default because cost and privacy grow together.

Add these controls before inviting testers:

- `MAX_LIVE_SESSION_SECONDS`.
- `MAX_LIVE_SESSIONS_PER_USER_PER_DAY`.
- Global concurrent-session cap.
- Monthly OpenAI billing alert.
- Text fallback when the quota is exceeded.
- Metrics for seconds, tool calls, failures and approvals.

## Agents SDK decision for muzapp

### Do not add it for the first demo

The current `src/lib/agent` and `src/lib/whatsapp` layers already provide prompts, tools, Zod validation, data access and business operations. The shortest safe path is:

```text
GPT-Live-1 voice session
  -> client delegation
  -> Next.js Voice Tool Gateway
  -> existing AI SDK / business functions
```

### Add it later if

- Voice and text agents need shared handoffs.
- The team wants SDK-native tracing and guardrails.
- A Realtime model is chosen instead of GPT-Live-1.
- The agent workflow grows beyond the current modular Next.js layer.

If that decision is made, do it as a separate migration with one source of truth for tool schemas. Do not maintain duplicated tools in AI SDK and Agents SDK indefinitely.

## Demo acceptance criteria

- A signed-in demo user can start and end a voice session.
- The primary API key is absent from browser-visible configuration.
- The agent can answer hours, menu and delivery questions.
- At least one existing business function is reused through the gateway.
- The agent can draft a customer reply but cannot send it without a visible approval.
- The UI shows the tool status and refuses unauthorized operations.
- An interrupted session does not duplicate a tool operation.
- A disconnected session releases its slot and does not leave a worker running.
- The demo can run on the existing single Render deployment.

## Sources checked 2026-09-16

- GPT-Live-1 model and pricing: https://developers.openai.com/api/docs/models/gpt-live-1
- GPT-Live guide: https://developers.openai.com/api/docs/guides/live
- Delegation and tools: https://developers.openai.com/api/docs/guides/live-delegation
- OpenAI tools and function calling: https://developers.openai.com/api/docs/guides/tools
- Agents SDK voice quickstart: https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart
- Agents SDK voice tools: https://openai.github.io/openai-agents-js/guides/voice-agents/build
- Muzapp agent: `src/lib/whatsapp/agent.ts`
- Muzapp tools: `src/lib/whatsapp/tools/`
- Muzapp WhatsApp webhook: `src/app/api/webhook/whatsapp/route.ts`
