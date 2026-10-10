"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MediaRenderer } from "./media-renderer";
import { LinkPreview } from "./link-preview";
import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// user = left (incoming), assistant = right (bot response), human = right (operator)
const roleStyles: Record<string, string> = {
  user: "bg-muted/40 border-border",
  assistant: "bg-primary/10 border-primary/20 ml-auto",
  human: "bg-blue-500/10 border-blue-500/20 ml-auto",
  system: "bg-muted border-border mx-auto text-center",
};

const roleLabels: Record<string, string | null> = {
  user: null,
  assistant: "Bot",
  human: "Operador",
  system: null,
};

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  // Deduplicate
  return [...new Set(matches)];
}

/**
 * Replace URLs in text with plain text (link preview renders below).
 */
function stripUrls(text: string): string {
  return text.replace(URL_REGEX, "").replace(/\s+/g, " ").trim();
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const label = roleLabels[message.role];
  const isSystem = message.role === "system";

  // Detect URLs for link previews
  const urls = message.content ? extractUrls(message.content) : [];
  const hasLinks = urls.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 border",
        roleStyles[message.role] || roleStyles.user
      )}
    >
      {/* Role label */}
      {label && (
        <span className="block text-[10px] font-medium text-muted-foreground mb-1">
          {label}
        </span>
      )}

      {/* Media attachments */}
      {message.contentAttributes && message.contentAttributes.length > 0 && (
        <div className="space-y-2 mb-2">
          {message.contentAttributes.map((media, i) => (
            <MediaRenderer key={i} media={media} />
          ))}
        </div>
      )}

      {/* Text content (URLs are stripped — rendered as link previews below) */}
      {message.content && !isSystem && (
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
          {hasLinks ? stripUrls(message.content) : message.content}
        </p>
      )}
      {isSystem && (
        <p className="text-xs text-muted-foreground italic">{message.content}</p>
      )}

      {/* Link previews */}
      {hasLinks && (
        <div className="space-y-1.5 mt-1.5">
          {urls.map((url, i) => (
            <LinkPreview key={i} url={url} />
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div className={cn("mt-1", isSystem ? "text-center" : message.role === "user" ? "text-left" : "text-right")}>
        <span className="text-[10px] text-muted-foreground">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
