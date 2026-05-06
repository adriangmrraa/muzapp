import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface CampaignPerformance {
  campaign: string;
  leadCount: number;
  convertedCount: number;
  rate: number;
}

interface CampaignTableProps {
  data: CampaignPerformance[];
}

export function CampaignTable({ data }: CampaignTableProps) {
  return (
    <div className="rounded-xl bg-card border border-border/40 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border/40">
        <h2 className="text-base font-semibold text-foreground">
          Rendimiento por Campaña
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Leads y conversiones por cada campaña
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border/40 hover:bg-transparent">
            <TableHead className="px-6 text-muted-foreground font-medium">
              Campaña
            </TableHead>
            <TableHead className="px-4 text-muted-foreground font-medium text-right">
              Leads
            </TableHead>
            <TableHead className="px-4 text-muted-foreground font-medium text-right">
              Conversiones
            </TableHead>
            <TableHead className="px-6 text-muted-foreground font-medium text-right">
              Tasa
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell
                colSpan={4}
                className="px-6 py-8 text-center text-sm text-muted-foreground"
              >
                No hay campañas con datos
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow key={idx} className="border-border/40">
                <TableCell className="px-6 font-medium text-foreground">
                  {row.campaign}
                </TableCell>
                <TableCell className="px-4 text-right text-foreground">
                  {row.leadCount}
                </TableCell>
                <TableCell className="px-4 text-right text-foreground">
                  {row.convertedCount}
                </TableCell>
                <TableCell className="px-6 text-right">
                  <span
                    className={
                      row.rate >= 50
                        ? "text-green-400 font-medium"
                        : row.rate >= 20
                        ? "text-yellow-400 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {row.rate.toFixed(1)}%
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
