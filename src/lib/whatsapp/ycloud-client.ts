// YCloud WhatsApp API client
// POST https://api.ycloud.com/v2/whatsapp/messages

interface SendMessageParams {
  to: string;        // recipient phone number (E.164 format)
  body: string;      // text message content
  apiKey: string;    // YCloud API key
  from: string;      // sender phone number
}

interface YCloudResponse {
  id: string;
  status: string;
}

export async function sendWhatsAppMessage({ to, body, apiKey, from }: SendMessageParams): Promise<YCloudResponse> {
  const response = await fetch("https://api.ycloud.com/v2/whatsapp/messages/sendDirectly", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      from,
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YCloud API error (${response.status}): ${error}`);
  }

  const result = await response.json();
  console.log(`[ycloud] Message sent to ${to} — id:${result.id} status:${result.status}`);
  return result;
}
