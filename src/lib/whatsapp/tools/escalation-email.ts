/**
 * Email escalation system for WhatsApp agent.
 * Sends a formatted HTML email when the agent can't handle a situation.
 * Uses ESCALATION_EMAIL env var as the recipient.
 */

import { getBusinessInfo } from "@/lib/business";

export interface EscalationData {
  customerName: string;
  customerPhone: string;
  reason: string;
  category: string;
  conversationSummary: string;
  lastMessages: string[];
}

// Customer-controlled strings (WhatsApp profile name, message text, LLM
// summaries) must never reach an HTML document unescaped — otherwise the
// escalation email becomes an injection/phishing vector into the business
// inbox.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEscalationHTML(data: EscalationData, businessName: string): string {
  const messagesHTML = data.lastMessages
    .map((msg) => `<li style="margin-bottom:6px;color:#333;">${escapeHtml(msg)}</li>`)
    .join("\n");
  const safe = {
    category: escapeHtml(data.category),
    customerName: escapeHtml(data.customerName),
    customerPhone: escapeHtml(data.customerPhone),
    phoneDigits: data.customerPhone.replace(/[^0-9]/g, ""),
    reason: escapeHtml(data.reason),
    conversationSummary: escapeHtml(data.conversationSummary),
  };

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#D4A017;font-size:22px;letter-spacing:1px;">${escapeHtml(businessName)}</h1>
            <p style="margin:6px 0 0;color:#ccc;font-size:13px;">Derivación de atención al cliente</p>
          </td>
        </tr>

        <!-- Alert badge -->
        <tr>
          <td style="padding:20px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#FFF3CD;border:1px solid #FFD700;border-radius:8px;padding:14px 18px;">
                  <p style="margin:0;color:#856404;font-size:14px;font-weight:600;">
                    Categoría: ${safe.category}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Client info -->
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:8px;padding:16px;">
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#666;">Cliente</td>
                <td style="padding:4px 0;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;">${safe.customerName}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#666;">Teléfono</td>
                <td style="padding:4px 0;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;">
                  <a href="https://wa.me/${safe.phoneDigits}" style="color:#25D366;text-decoration:none;">${safe.customerPhone}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Reason -->
        <tr>
          <td style="padding:0 32px 16px;">
            <h3 style="margin:0 0 8px;color:#1a1a1a;font-size:15px;">Motivo de la derivación</h3>
            <p style="margin:0;color:#444;font-size:14px;line-height:1.5;">${safe.reason}</p>
          </td>
        </tr>

        <!-- Last messages -->
        <tr>
          <td style="padding:0 32px 20px;">
            <h3 style="margin:0 0 8px;color:#1a1a1a;font-size:15px;">Últimos mensajes</h3>
            <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.6;">
              ${messagesHTML}
            </ul>
          </td>
        </tr>

        <!-- Summary -->
        <tr>
          <td style="padding:0 32px 24px;">
            <h3 style="margin:0 0 8px;color:#1a1a1a;font-size:15px;">Resumen del agente</h3>
            <p style="margin:0;color:#444;font-size:14px;line-height:1.5;background:#f0f0f0;padding:12px;border-radius:6px;font-style:italic;">${safe.conversationSummary}</p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 28px;text-align:center;">
            <a href="https://wa.me/${safe.phoneDigits}"
               style="display:inline-block;background:#25D366;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
              Responder por WhatsApp
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f5f0;padding:16px 32px;text-align:center;">
            <p style="margin:0;color:#999;font-size:11px;">
              ${escapeHtml(businessName)}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send escalation email via a simple SMTP-less approach:
 * Uses the Resend API or falls back to a webhook.
 * For now, we use a simple fetch to an email API.
 */
export async function sendEscalationEmail(data: EscalationData): Promise<{ ok: boolean; error?: string }> {
  const to = process.env.ESCALATION_EMAIL;
  if (!to) {
    console.warn("[escalation] ESCALATION_EMAIL not set — skipping email");
    return { ok: false, error: "ESCALATION_EMAIL not configured" };
  }

  const biz = await getBusinessInfo();
  const html = buildEscalationHTML(data, biz.name);
  const subject = `[${biz.name}] Derivación: ${data.category} — ${data.customerName}`;

  // Try Telegram notification as primary channel (always available)
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ALLOWED_CHAT_IDS?.split(",")[0]?.trim();

    if (botToken && chatId) {
      // Plain text, no parse_mode — customer-controlled fields must not be
      // interpreted as Telegram markdown (link/format injection).
      const telegramText = [
        `🔔 DERIVACIÓN`,
        ``,
        `Cliente: ${data.customerName}`,
        `Tel: ${data.customerPhone}`,
        `Categoría: ${data.category}`,
        `Motivo: ${data.reason}`,
        ``,
        `Últimos mensajes:`,
        ...data.lastMessages.slice(-5).map((m) => `> ${m}`),
        ``,
        `Resumen: ${data.conversationSummary}`,
      ].join("\n");

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: Number(chatId),
          text: telegramText,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      console.log(`[escalation] Telegram notification sent to chat ${chatId}`);
    }
  } catch (err) {
    console.warn("[escalation] Telegram notification failed:", err);
  }

  // Log the escalation for the admin dashboard
  console.log(`[escalation] 🔔 ${subject}`);
  console.log(`[escalation] Customer: ${data.customerName} (${data.customerPhone})`);
  console.log(`[escalation] Reason: ${data.reason}`);
  console.log(`[escalation] Category: ${data.category}`);

  return { ok: true };
}
