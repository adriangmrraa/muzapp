// Legacy webhook path — kept for backwards compatibility with any YCloud
// configuration still pointing here. Both URLs must run the SAME pipeline
// (signature verify, durable dedup, session policy, agent routing), so this
// route delegates to the canonical implementation at /api/whatsapp/webhook.
export { GET, POST } from "@/app/api/whatsapp/webhook/route";
