import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session) {
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
        { error: `Tipo de archivo no permitido: ${file.type}. Solo jpeg, png, webp, gif.` },
        { status: 400 }
      );
    }

    // ─── Validate size ───────────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo 10MB.` },
        { status: 413 }
      );
    }

    // ─── Generate unique filename ────────────────────────────────────────────
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ext === "jpeg" ? "jpg" : ext;
    const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${safeExt}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);

    // ─── Save file ───────────────────────────────────────────────────────────
    await mkdir(UPLOADS_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // ─── Return URL ──────────────────────────────────────────────────────────
    const url = `/uploads/${uniqueName}`;
    console.log(`[upload] Saved: ${url} (${(file.size / 1024).toFixed(1)}KB)`);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}
