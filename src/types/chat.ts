export type Channel = "whatsapp" | "telegram";

export type MessageRole = "user" | "assistant" | "system" | "human";

export type MediaType = "image" | "audio" | "video" | "document";

export interface MediaAttachment {
  type: MediaType;
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  transcription?: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  role: MessageRole;
  content: string;
  contentAttributes?: MediaAttachment[];
  createdAt: string;
}

export interface ConversationSummary {
  id: number;
  channel: Channel;
  customerName: string | null;
  customerPhone: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  status: "active" | "closed" | "archived";
  messageCount?: number;
}

export type ConversationFilter = "all" | "whatsapp" | "telegram" | "active" | "closed";
