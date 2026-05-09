import { db } from "@/db";
import { attachments } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const VISION_TIMEOUT_MS = 30_000;
const RACE_TIMEOUT_MS = 15_000;

const FALLBACK_DESCRIPTION = "[Imagen sin descripción]";
const PROCESSING_PLACEHOLDER = "[Imagen enviada, procesando...]";

const VISION_PROMPT = `Sos un asistente de una rotisería premium argentina (Mrs Muzzarella) que analiza imágenes enviadas por clientes por WhatsApp.

Describí brevemente qué ves en la imagen en 1-2 oraciones. Sé conciso y directo.

Clasificá la imagen en una de estas categorías:
- COMPROBANTE: si es una captura de transferencia bancaria, recibo de pago, comprobante de Mercado Pago, o cualquier prueba de pago
- COMIDA: si es una foto de comida, hamburguesas, platos, ingredientes
- DOCUMENTO: si es una factura, presupuesto, lista, documento formal
- SELFIE: si es una selfie o foto de persona
- LOCAL: si es una foto de un local, negocio, cocina
- OTRO: cualquier otra cosa

Respondé SOLO con este formato exacto (sin markdown):
CATEGORIA: [categoría]
DESCRIPCION: [descripción breve]`;

// ─── Core: analyzeImage ──────────────────────────────────────────────────────

export async function analyzeImage(
  buffer: Buffer,
  mimeType: string,
  context?: string
): Promise<string> {
  if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
    return FALLBACK_DESCRIPTION;
  }

  try {
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    const userPrompt = context
      ? `Contexto adicional: ${context}\n\nAnalizá esta imagen.`
      : "Analizá esta imagen.";

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: VISION_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: { url: dataUri, detail: "low" },
                },
              ],
            },
          ],
          max_tokens: 200,
        }),
        signal: AbortSignal.timeout(VISION_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      console.error("[vision] OpenAI API error:", response.status);
      return FALLBACK_DESCRIPTION;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() || FALLBACK_DESCRIPTION;
  } catch (error) {
    console.error("[vision] Error:", error);
    return FALLBACK_DESCRIPTION;
  }
}

// ─── Race helper: Vision con timeout ─────────────────────────────────────────

export interface VisionRaceResult {
  resolved: boolean;
  description: string;
  pendingPromise?: Promise<string>;
}

export async function raceVision(
  buffer: Buffer,
  mimeType: string,
  context?: string
): Promise<VisionRaceResult> {
  const visionPromise = analyzeImage(buffer, mimeType, context);

  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), RACE_TIMEOUT_MS)
  );

  const result = await Promise.race([visionPromise, timeoutPromise]);

  if (result !== null) {
    return { resolved: true, description: result };
  }

  // Timeout — vision still running in background
  return {
    resolved: false,
    description: PROCESSING_PLACEHOLDER,
    pendingPromise: visionPromise,
  };
}

// ─── Helper compartido: processImageWithVision ───────────────────────────────

export interface ProcessImageResult {
  agentText: string;
  description: string;
  documentType: string;
  backgroundPersist?: () => void;
}

export async function processImageWithVision(
  buffer: Buffer,
  mimeType: string,
  attachmentId: number,
  messageId: number,
  context?: string
): Promise<ProcessImageResult> {
  const race = await raceVision(buffer, mimeType, context);

  const documentType = parseDocumentType(race.description);

  if (race.resolved) {
    // Vision terminó a tiempo — persistir inmediato
    persistDescription(attachmentId, messageId, race.description, documentType).catch(
      (err) => console.error("[vision] persist error:", err)
    );

    return {
      agentText: `[Imagen]: ${formatForAgent(race.description)}`,
      description: race.description,
      documentType,
    };
  }

  // Timeout — devolver placeholder, persistir cuando termine
  const backgroundPersist = () => {
    race.pendingPromise!.then((desc) => {
      const docType = parseDocumentType(desc);
      persistDescription(attachmentId, messageId, desc, docType).catch(
        (err) => console.error("[vision] async persist error:", err)
      );
    });
  };

  return {
    agentText: PROCESSING_PLACEHOLDER,
    description: PROCESSING_PLACEHOLDER,
    documentType: "pending",
    backgroundPersist,
  };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function parseDocumentType(description: string): string {
  const match = description.match(/CATEGORIA:\s*(\w+)/i);
  if (!match) return "image";

  const category = match[1].toUpperCase();
  switch (category) {
    case "COMPROBANTE":
      return "payment_receipt";
    case "COMIDA":
      return "food_photo";
    case "DOCUMENTO":
      return "document";
    case "SELFIE":
      return "selfie";
    case "LOCAL":
      return "location_photo";
    default:
      return "image";
  }
}

function formatForAgent(description: string): string {
  // Extract just the description line for the agent
  const match = description.match(/DESCRIPCION:\s*(.+)/i);
  return match ? match[1].trim() : description;
}

async function persistDescription(
  attachmentId: number,
  messageId: number,
  description: string,
  documentType: string
): Promise<void> {
  await db
    .update(attachments)
    .set({ description, documentType })
    .where(eq(attachments.id, attachmentId));

  // Also update contentAttributes in chatMessages
  try {
    const { chatMessages } = await import("@/db/schema");
    const [msg] = await db
      .select({ contentAttributes: chatMessages.contentAttributes })
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId))
      .limit(1);

    if (msg?.contentAttributes) {
      const attrs = msg.contentAttributes as Array<Record<string, unknown>>;
      if (attrs.length > 0) {
        attrs[0].description = description;
        await db
          .update(chatMessages)
          .set({ contentAttributes: attrs as any })
          .where(eq(chatMessages.id, messageId));
      }
    }
  } catch (err) {
    console.error("[vision] contentAttributes update error:", err);
  }
}
