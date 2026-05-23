import { useCustomerOrders } from "@/lib/conversations/queries";
import { Badge } from "@/components/ui/badge";

const ORDER_STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive"> = {
  pending: "default",
  preparing: "warning",
  ready: "default",
  delivered: "success",
  cancelled: "destructive",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

interface OrderHistoryProps {
  leadId: number;
  expanded: boolean;
}

export function OrderHistory({ leadId, expanded }: OrderHistoryProps) {
  const { data: orders, isLoading } = useCustomerOrders(leadId, expanded);

  if (!expanded) return null;

  if (isLoading) {
    return <p className="text-xs text-neutral-500 py-2">Cargando pedidos...</p>;
  }

  if (!orders || orders.length === 0) {
    return <p className="text-xs text-neutral-500 py-2">Sin pedidos</p>;
  }

  return (
    <div className="space-y-1.5">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-neutral-200">#{order.id}</span>
            <span className="text-[11px] text-neutral-500 capitalize">
              {order.orderType?.replace("_", " ") ?? "—"}
            </span>
          </div>
          <Badge
            variant={ORDER_STATUS_COLORS[order.status] ?? "default"}
            className="text-[10px] px-1.5 py-0"
          >
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
