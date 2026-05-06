const YCLOUD_API_URL =
  "https://api.ycloud.com/v2/whatsapp/messages/sendDirectly";

type SendTextResult =
  | { ok: true }
  | { ok: false; error: string };

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendText(
  to: string,
  text: string
): Promise<SendTextResult> {
  const apiKey = process.env.YCLOUD_API_KEY;
  const from = process.env.WHATSAPP_PHONE_NUMBER;

  if (!apiKey || !from) {
    return { ok: false, error: "Missing YCLOUD_API_KEY or WHATSAPP_PHONE_NUMBER" };
  }

  const body = JSON.stringify({
    from,
    to,
    type: "text",
    text: { body: text, preview_url: false },
  });

  for (let attempt = 0; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(YCLOUD_API_URL, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { ok: true };
      }

      if (response.status >= 500 && attempt < 2) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }

      const errorText = await response.text().catch(() => "unknown error");
      return { ok: false, error: `YCloud error ${response.status}: ${errorText}` };
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt < 2) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Fetch error: ${message}` };
    }
  }

  return { ok: false, error: "Max retries exceeded" };
}
