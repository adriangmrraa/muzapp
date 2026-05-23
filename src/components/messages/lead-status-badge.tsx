import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" }> = {
  new: { label: "Nuevo", variant: "default" },
  contacted: { label: "Contactado", variant: "warning" },
  converted: { label: "Convertido", variant: "success" },
  lost: { label: "Perdido", variant: "destructive" },
};

interface LeadStatusBadgeProps {
  status: string;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
