import { transcribeAudio } from "./transcription";

/**
 * Analiza un video: extrae la pista de audio y la transcribe con Whisper.
 * Whisper acepta video/mp4 directo (extrae el audio automáticamente).
 */
export async function analyzeVideo(
  videoBuffer: Buffer,
  filename: string,
  mimeType?: string,
  caption?: string
): Promise<{ transcription: string | null; agentText: string }> {
  // Whisper acepta video/mp4 — extrae el audio automáticamente
  const transcription = await transcribeAudio(videoBuffer, filename, mimeType);

  const desc = caption ? ` (caption: "${caption}")` : "";

  const agentText = transcription
    ? `[Video${desc}]: ${transcription}`
    : `[Video${desc}]: el cliente envió un video${caption ? `: ${caption}` : ""}`;

  return { transcription, agentText };
}
