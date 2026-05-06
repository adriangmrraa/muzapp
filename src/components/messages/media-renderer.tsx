"use client";

import { FileText, Play, Mic, Download, Image as ImageIcon } from "lucide-react";
import type { MediaAttachment } from "@/types/chat";

interface MediaRendererProps {
  media: MediaAttachment;
}

function resolveUrl(url: string): string {
  if (url.startsWith("http") || url.startsWith("//")) return url;
  return `${typeof window !== "undefined" ? window.location.origin : ""}${url}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageMedia({ media }: { media: MediaAttachment }) {
  return (
    <div className="relative rounded-lg overflow-hidden group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolveUrl(media.url)}
        alt={media.caption || "Imagen"}
        className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer transition-transform group-hover:scale-[1.02]"
        loading="lazy"
      />
      {media.caption && (
        <p className="text-xs text-neutral-300 mt-1">{media.caption}</p>
      )}
    </div>
  );
}

function AudioMedia({ media }: { media: MediaAttachment }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2.5">
        <Mic className="h-4 w-4 text-[#D4A017] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-[#D4A017] to-[#F5A623] rounded-full" />
          </div>
        </div>
        {media.fileSize && (
          <span className="text-[10px] text-neutral-500 flex-shrink-0">
            {formatFileSize(media.fileSize)}
          </span>
        )}
      </div>
      {media.transcription && (
        <p className="text-xs text-neutral-400 italic px-1">
          &ldquo;{media.transcription}&rdquo;
        </p>
      )}
    </div>
  );
}

function VideoMedia({ media }: { media: MediaAttachment }) {
  return (
    <div className="relative rounded-lg overflow-hidden bg-black/40 cursor-pointer group">
      <div className="aspect-video flex items-center justify-center">
        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Play className="h-5 w-5 text-white ml-0.5" fill="currentColor" />
        </div>
      </div>
      {media.caption && (
        <p className="text-xs text-neutral-300 px-2 pb-2">{media.caption}</p>
      )}
    </div>
  );
}

function DocumentMedia({ media }: { media: MediaAttachment }) {
  return (
    <a
      href={resolveUrl(media.url)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5 border border-white/10 hover:border-[#D4A017]/30 transition-colors group"
    >
      <FileText className="h-5 w-5 text-[#D4A017] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-200 truncate">
          {media.fileName || "Documento"}
        </p>
        <div className="flex items-center gap-2">
          {media.mimeType && (
            <span className="text-[10px] text-neutral-500 uppercase">
              {media.mimeType.split("/").pop()}
            </span>
          )}
          {media.fileSize && (
            <span className="text-[10px] text-neutral-500">
              {formatFileSize(media.fileSize)}
            </span>
          )}
        </div>
      </div>
      <Download className="h-4 w-4 text-neutral-500 group-hover:text-[#D4A017] transition-colors flex-shrink-0" />
    </a>
  );
}

export function MediaRenderer({ media }: MediaRendererProps) {
  switch (media.type) {
    case "image":
      return <ImageMedia media={media} />;
    case "audio":
      return <AudioMedia media={media} />;
    case "video":
      return <VideoMedia media={media} />;
    case "document":
      return <DocumentMedia media={media} />;
    default:
      return (
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
          <ImageIcon className="h-4 w-4 text-neutral-400" />
          <span className="text-xs text-neutral-400">Archivo no soportado</span>
        </div>
      );
  }
}
