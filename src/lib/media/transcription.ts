function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB — límite de Whisper API

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[transcription] OPENAI_API_KEY not set");
    return null;
  }

  // Whisper tiene un límite de 25 MB por archivo
  if (audioBuffer.length > MAX_FILE_SIZE) {
    console.warn(`[transcription] Audio too large: ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB (max 25MB)`);
    return null;
  }

  const MAX_ATTEMPTS = 2;
  const RETRY_DELAY = 2000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const blobType = mimeType || "audio/ogg";
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: blobType });
      formData.append("file", blob, filename || "audio." + (mimeType?.split("/")[1] || "ogg"));
      formData.append("model", "whisper-1");
      formData.append("language", "es");

      console.log(`[transcription] Sending to Whisper: ${(audioBuffer.length / 1024).toFixed(0)}KB (attempt ${attempt + 1})`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const result = (await response.json()) as { text?: string };
        if (result.text) {
          console.log(`[transcription] OK: "${result.text.slice(0, 80)}..."`);
          return result.text;
        }
      }

      // Log error detail
      const errorBody = await response.text().catch(() => "no body");
      console.error(
        `[transcription] Whisper API error (attempt ${attempt + 1}/${MAX_ATTEMPTS}): status=${response.status}`,
        errorBody.slice(0, 500)
      );

      if (attempt < MAX_ATTEMPTS - 1) {
        console.log(`[transcription] Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const isTimeout = msg.includes("abort") || msg.includes("timeout");
      console.error(
        `[transcription] ${isTimeout ? "TIMEOUT" : "Error"} (attempt ${attempt + 1}/${MAX_ATTEMPTS}):`,
        msg
      );

      if (attempt < MAX_ATTEMPTS - 1) {
        console.log(`[transcription] Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  console.warn(`[transcription] All attempts failed, returning null. MimeType: ${mimeType || "unknown"}, fileSize: ${(audioBuffer.length / 1024).toFixed(0)}KB`);
  return null;
}
