"use client";

export interface DailyLeads {
  date: string;
  count: number;
  source: string | null;
}

interface LeadsChartProps {
  data: DailyLeads[];
}

const SOURCE_COLORS: Record<string, string> = {
  facebook: "bg-blue-500",
  instagram: "bg-purple-500",
  whatsapp: "bg-green-500",
  organic: "bg-emerald-400",
  direct: "bg-yellow-400",
};

const DEFAULT_COLOR = "bg-primary";

function getBarColor(source: string | null): string {
  if (!source) return DEFAULT_COLOR;
  const key = source.toLowerCase();
  return SOURCE_COLORS[key] ?? DEFAULT_COLOR;
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

export function LeadsChart({ data }: LeadsChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border/40 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-1">
          Leads por Día
        </h2>
        <p className="text-xs text-muted-foreground mb-6">Últimos 30 días</p>
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          No hay datos aún
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Collect unique sources for the legend
  const uniqueSources = Array.from(
    new Set(data.map((d) => d.source).filter(Boolean))
  ) as string[];

  return (
    <div className="rounded-xl bg-card border border-border/40 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground mb-1">
        Leads por Día
      </h2>
      <p className="text-xs text-muted-foreground mb-6">Últimos 30 días</p>

      {/* Chart area */}
      <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
        {data.map((entry, idx) => {
          const heightPct = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
          const color = getBarColor(entry.source);
          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 flex-1 min-w-[20px] group"
              title={`${formatDate(entry.date)}: ${entry.count} leads${entry.source ? ` (${entry.source})` : ""}`}
            >
              {/* Bar */}
              <div className="w-full flex items-end justify-center h-full">
                <div
                  className={`w-full rounded-t transition-all ${color} opacity-80 group-hover:opacity-100`}
                  style={{ height: `${Math.max(heightPct, entry.count > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X axis labels — show every ~5th label to avoid crowding */}
      <div className="flex items-start gap-1 overflow-x-auto mt-1">
        {data.map((entry, idx) => (
          <div
            key={idx}
            className="flex-1 min-w-[20px] text-center"
          >
            {idx % 5 === 0 ? (
              <span className="text-[9px] text-muted-foreground leading-none">
                {formatDate(entry.date)}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Legend */}
      {uniqueSources.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {uniqueSources.map((src) => (
            <div key={src} className="flex items-center gap-1.5">
              <div className={`size-2.5 rounded-sm ${getBarColor(src)}`} />
              <span className="text-xs text-muted-foreground capitalize">{src}</span>
            </div>
          ))}
          {data.some((d) => !d.source) && (
            <div className="flex items-center gap-1.5">
              <div className={`size-2.5 rounded-sm ${DEFAULT_COLOR}`} />
              <span className="text-xs text-muted-foreground">Sin fuente</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
