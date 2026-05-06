"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { fadeUpSmall } from "@/lib/animation-variants";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ClientSummary {
  phone: string;
  name: string | null;
  totalOrders: number;
  lastOrderDate: Date | null;
  lastOrderType: string | null;
  leadStatus: string | null;
  totalConversations: number;
}

interface ClientsTableProps {
  clients: ClientSummary[];
  currentPage: number;
  totalPages: number;
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return dateFormatter.format(new Date(date));
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-foreground break-words">{value}</span>
    </div>
  );
}

export default function ClientsTable({
  clients,
  currentPage,
  totalPages,
}: ClientsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(overrides).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      return `/admin/clients?${params.toString()}`;
    },
    [searchParams]
  );

  const handlePageChange = (newPage: number) => {
    router.push(buildUrl({ page: String(newPage) }));
  };

  const handleRowClick = (client: ClientSummary) => {
    setSelectedClient(client);
    setSheetOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Último Pedido</TableHead>
            <TableHead>Total Pedidos</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <motion.tr
              key={client.phone}
              variants={fadeUpSmall}
              initial="hidden"
              animate="visible"
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(client)}
            >
              <TableCell>
                <div className="font-medium">
                  {client.name || "Sin nombre"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {client.leadStatus || "Sin lead"}
                </div>
              </TableCell>
              <TableCell>
                <code className="text-sm">{client.phone}</code>
              </TableCell>
              <TableCell>
                <div>{formatDate(client.lastOrderDate)}</div>
                <div className="text-xs text-muted-foreground">
                  {client.lastOrderType || "—"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {client.totalOrders}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/clients/${encodeURIComponent(client.phone)}`);
                  }}
                >
                  Ver ficha →
                </Button>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Siguiente →
          </Button>
        </div>
      )}

      {/* Sheet detail */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {selectedClient?.name || "Cliente"}
            </SheetTitle>
          </SheetHeader>
          {selectedClient && (
            <div className="grid grid-cols-2 gap-4 pt-4">
              <DetailField label="Teléfono" value={selectedClient.phone} />
              <DetailField label="Total pedidos" value={selectedClient.totalOrders} />
              <DetailField label="Último pedido" value={formatDate(selectedClient.lastOrderDate)} />
              <DetailField label="Tipo" value={selectedClient.lastOrderType || "—"} />
              <DetailField label="Conversaciones" value={selectedClient.totalConversations} />
              <DetailField label="Lead status" value={selectedClient.leadStatus || "Sin lead"} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}