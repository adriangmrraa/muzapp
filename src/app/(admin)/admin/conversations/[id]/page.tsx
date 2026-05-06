import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

type ConversationStatus = "active" | "closed" | "archived";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseMessages(raw: Record<string, unknown>[] | null | undefined): Message[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.reduce<Message[]>((acc, item) => {
    if (
      item &&
      typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    ) {
      acc.push({
        role: item.role,
        content: item.content,
        timestamp: typeof item.timestamp === "string" ? item.timestamp : undefined,
      });
    }
    return acc;
  }, []);
}

function formatTime(timestamp: string | undefined): string | null {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

const statusConfig: Record<ConversationStatus, { label: string; variant: "default" | "secondary" | "warning" }> = {
  active: { label: "Activa", variant: "default" },
  closed: { label: "Cerrada", variant: "secondary" },
  archived: { label: "Archivada", variant: "warning" },
};

// ─── Page ──────────────────────────────────────────────────────────────────────

type Params = Promise<{ id: string }>;

export default async function ConversationDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) notFound();

  const row = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, numericId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row) notFound();

  const messages = parseMessages(row.messages);
  const status = row.status as ConversationStatus;
  const cfg = statusConfig[status] ?? statusConfig.closed;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* ─── Back link ─── */}
      <div>
        <Link
          href="/admin/conversations"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
          )}
        >
          <ArrowLeft className="size-4" />
          Volver a conversaciones
        </Link>
      </div>

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {row.customerName ?? <span className="text-muted-foreground italic">Sin nombre</span>}
          </h1>
          {row.customerPhone && (
            <p className="text-sm text-muted-foreground">{row.customerPhone}</p>
          )}
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      {/* ─── Chat ─── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 min-h-[300px]">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
            No hay mensajes en esta conversación.
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const time = formatTime(msg.timestamp);

            return (
              <div
                key={index}
                className={`flex flex-col gap-1 ${isUser ? "items-start" : "items-end"}`}
              >
                {/* Role label */}
                <span className="text-xs font-medium text-muted-foreground px-1">
                  {isUser ? "Cliente" : "Agente"}
                </span>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isUser
                      ? "bg-muted text-foreground rounded-tl-sm"
                      : "bg-primary/20 text-foreground rounded-tr-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  {time && (
                    <p className={`mt-1 text-[11px] text-muted-foreground ${isUser ? "text-left" : "text-right"}`}>
                      {time}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
