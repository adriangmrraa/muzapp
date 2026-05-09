function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<string> {
  const MAX_ATTEMPTS = 2;
  const RETRY_DELAY = 2000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const blobType = mimeType || "audio/ogg";
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: blobType });
      formData.append("file", blob, filename);
      formData.append("model", "whisper-1");
      formData.append("language", "es");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
        signal: AbortSignal.timeout(30_000),
      });

      if (response.ok) {
        const result = (await response.json()) as { text?: string };
        if (result.text) return result.text;
      }

      // Log error detail
      const errorBody = await response.text().catch(() => "no body");
      console.error(
        `[transcription] Whisper API error (attempt ${attempt + 1}/${MAX_ATTEMPTS}):`,
        response.status,
        errorBody.slice(0, 500)
      );

      if (attempt < MAX_ATTEMPTS - 1) {
        console.log(`[transcription] Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    } catch (error) {
      console.error(
        `[transcription] Error (attempt ${attempt + 1}/${MAX_ATTEMPTS}):`,
        error instanceof Error ? error.message : error
      );

      if (attempt < MAX_ATTEMPTS - 1) {
        console.log(`[transcription] Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  console.warn("[transcription] All attempts failed, returning fallback");
  return "[Audio sin transcripción]";
}
