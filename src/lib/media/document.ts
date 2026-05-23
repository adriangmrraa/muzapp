/**
 * Extrae texto de documentos usando pdf-parse.
 * Para PDFs: extrae texto completo.
 * Para otros formatos: devuelve solo el nombre del archivo.
 */

export async function extractDocumentText(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string | null> {
  if (!mimeType) return null;

  // PDF text extraction via pdf-parse
  if (mimeType === "application/pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const result = await parser.getText();
      const text = (result as unknown as { text: string }).text?.trim();
      if (text && text.length > 20) {
        return text.slice(0, 1500); // limitar a 1500 caracteres
      }
      return null;
    } catch {
      console.warn("[document] pdf-parse failed for", fileName);
      return null;
    }
  }

  // Plain text files
  if (mimeType === "text/plain") {
    return buffer.toString("utf-8").slice(0, 1500);
  }

  // Otros formatos: solo mencionamos el archivo
  return null;
}
