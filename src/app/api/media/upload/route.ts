import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { v2 as cloudinary } from "cloudinary";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// file.type is client-controlled — verify magic bytes before trusting it.
const MAGIC: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF....WEBP
  "image/gif": [[0x47, 0x49, 0x46, 0x38]], // GIF8
};

function matchesMagic(buffer: Buffer, mime: string): boolean {
  const sigs = MAGIC[mime];
  if (!sigs) return false;
  return sigs.some((sig) => sig.every((b, i) => buffer[i] === b));
}

// ─── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CLOUDINARY_FOLDER = "muzapp";

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
    }

    // ─── Validate MIME type ──────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo no permitido: ${file.type}. Solo jpeg, png, webp, gif.` },
        { status: 400 }
      );
    }

    // ─── Validate size ───────────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Archivo demasiado grande. Máximo 10MB.` },
        { status: 413 }
      );
    }

    // ─── Upload to Cloudinary ────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesMagic(buffer, file.type)) {
      return NextResponse.json(
        { error: "El contenido del archivo no coincide con su tipo." },
        { status: 400 }
      );
    }
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: CLOUDINARY_FOLDER,
      resource_type: "image",
    });

    const url = result.secure_url;
    console.log(`[upload] Cloudinary: ${url} (${(file.size / 1024).toFixed(1)}KB)`);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}
