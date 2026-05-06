"use client";

import { motion } from "framer-motion";
import { FileText, Download, Mic, ImageOff } from "lucide-react";
import type { MediaAttachment } from "@/types/chat";

interface AttachmentGalleryProps {
  attachments: MediaAttachment[];
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveUrl(url: string): string {
  if (url.startsWith("http") || url.startsWith("//")) return url;
  return `${typeof window !== "undefined" ? window.location.origin : ""}${url}`;
}

function ImageGrid({ images }: { images: MediaAttachment[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((img, i) => (
        <motion.a
          key={i}
          href={resolveUrl(img.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveUrl(img.url)}
            alt={img.caption || `Imagen ${i + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </motion.a>
      ))}
    </div>
  );
}

function AudioList({ audios }: { audios: MediaAttachment[] }) {
  return (
    <div className="space-y-2">
      {audios.map((audio, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5 border border-white/10"
        >
          <Mic className="h-4 w-4 text-[#D4A017] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-200 truncate">
              {audio.fileName || `Audio ${i + 1}`}
            </p>
            {audio.fileSize && (
              <p className="text-[10px] text-neutral-500">{formatFileSize(audio.fileSize)}</p>
            )}
          </div>
          <a
            href={resolveUrl(audio.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-white/10 text-neutral-400 hover:text-[#D4A017] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      ))}
    </div>
  );
}

function DocumentList({ docs }: { docs: MediaAttachment[] }) {
  return (
    <div className="space-y-2">
      {docs.map((doc, i) => (
        <a
          key={i}
          href={resolveUrl(doc.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5 border border-white/10 hover:border-[#D4A017]/30 transition-colors group"
        >
          <FileText className="h-5 w-5 text-[#D4A017] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-200 truncate">
              {doc.fileName || "Documento"}
            </p>
            <div className="flex items-center gap-2">
              {doc.mimeType && (
                <span className="text-[10px] text-neutral-500 uppercase">
                  {doc.mimeType.split("/").pop()}
                </span>
              )}
              {doc.fileSize && (
                <span className="text-[10px] text-neutral-500">
                  {formatFileSize(doc.fileSize)}
                </span>
              )}
            </div>
          </div>
          <Download className="h-4 w-4 text-neutral-500 group-hover:text-[#D4A017] transition-colors flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  if (!attachments || attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
        <ImageOff className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Sin archivos adjuntos</p>
      </div>
    );
  }

  const images = attachments.filter((a) => a.type === "image");
  const audios = attachments.filter((a) => a.type === "audio");
  const documents = attachments.filter((a) => a.type === "document" || a.type === "video");

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <section>
          <h4 className="text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
            Imágenes ({images.length})
          </h4>
          <ImageGrid images={images} />
        </section>
      )}

      {audios.length > 0 && (
        <section>
          <h4 className="text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
            Audio ({audios.length})
          </h4>
          <AudioList audios={audios} />
        </section>
      )}

      {documents.length > 0 && (
        <section>
          <h4 className="text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
            Documentos ({documents.length})
          </h4>
          <DocumentList docs={documents} />
        </section>
      )}
    </div>
  );
}
