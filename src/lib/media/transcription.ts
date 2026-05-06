export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" });
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

    if (!response.ok) {
      console.error("[transcription] Whisper API error:", response.status);
      return "[Audio sin transcripción]";
    }

    const result = (await response.json()) as { text?: string };
    return result.text || "[Audio sin transcripción]";
  } catch (error) {
    console.error("[transcription] Error:", error);
    return "[Audio sin transcripción]";
  }
}
