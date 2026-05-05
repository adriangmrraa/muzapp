"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ConversationStatus = "active" | "closed" | "archived";

interface ConversationRow {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
  status: ConversationStatus;
  messageCount: number;
  createdAt: Date;
}

interface Props {
  conversations: ConversationRow[];
  currentPage: number;
  totalPages: number;
  statusFilter: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(date: Date): string {
  return dateFormatter.format(new Date(date));
}

const statusConfig: Record<
  ConversationStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Activa",
    className:
      "bg-blue-500/15 text-blue-400 hover:bg-blue-500/20 border-0",
  },
  closed: {
    label: "Cerrada",
    className:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-0",
  },
  archived: {
    label: "Archivada",
    className:
      "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/20 border-0",
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ConversationsTable({
  conversations,
  currentPage,
  totalPages,
  statusFilter,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function buildUrl(params: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    return `/admin/conversations?${next.toString()}`;
  }

  function handleStatusChange(value: string) {
    router.push(buildUrl({ status: value || undefined, page: "1" }));
  }

  function handleRowClick(id: number) {
    router.push(`/admin/conversations/${id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Filters ─── */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filtrar por estado:</span>
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <SelectOption value="">Todos</SelectOption>
            <SelectOption value="active">Activa</SelectOption>
            <SelectOption value="closed">Cerrada</SelectOption>
            <SelectOption value="archived">Archivada</SelectOption>
          </Select>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Mensajes</TableHead>
              <TableHead>Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron conversaciones.
                </TableCell>
              </TableRow>
            ) : (
              conversations.map((conv) => {
                const cfg = statusConfig[conv.status];
                return (
                  <TableRow
                    key={conv.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(conv.id)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {conv.customerName ?? <span className="text-muted-foreground italic">Sin nombre</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {conv.customerPhone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={cfg.className}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-foreground">
                      {conv.messageCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(conv.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Pagination ─── */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Página <span className="font-medium text-foreground">{currentPage}</span> de{" "}
          <span className="font-medium text-foreground">{totalPages}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() =>
              router.push(buildUrl({ page: String(currentPage - 1) }))
            }
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() =>
              router.push(buildUrl({ page: String(currentPage + 1) }))
            }
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
