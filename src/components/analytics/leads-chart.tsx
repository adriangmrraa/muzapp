"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUpSmall } from "@/lib/animation-variants";

export interface DailyLeads {
  date: string;
  count: number;
  source: string | null;
}

interface LeadsChartProps {
  data: DailyLeads[];
}

// ─── Source colours ───────────────────────────────────────────────────────────

const SOURCE_BG: Record<string, string> = {
  facebook: "rgba(59,130,246,0.7)",
  instagram: "rgba(168,85,247,0.7)",
  whatsapp: "rgba(34,197,94,0.7)",
  organic: "rgba(52,211,153,0.7)",
  direct: "rgba(250,204,21,0.7)",
};

const SOURCE_BG_HOVER: Record<string, string> = {
  facebook: "rgba(59,130,246,1)",
  instagram: "rgba(168,85,247,1)",
  whatsapp: "rgba(34,197,94,1)",
  organic: "rgba(52,211,153,1)",
  direct: "rgba(250,204,21,1)",
};

const SOURCE_DOT: Record<string, string> = {
  facebook: "bg-blue-500",
  instagram: "bg-purple-500",
  whatsapp: "bg-green-500",
  organic: "bg-emerald-400",
  direct: "bg-yellow-400",
};

const DEFAULT_BG = "rgba(212,160,23,0.6)";
const DEFAULT_BG_HOVER = "rgba(212,160,23,1)";
const DEFAULT_DOT = "bg-yellow-500";

function getBarBg(source: string | null, hovered: boolean): string {
  if (!source) return hovered ? DEFAULT_BG_HOVER : DEFAULT_BG;
  const key = source.toLowerCase();
  const map = hovered ? SOURCE_BG_HOVER : SOURCE_BG;
  return map[key] ?? (hovered ? DEFAULT_BG_HOVER : DEFAULT_BG);
}

function getDotClass(source: string | null): string {
  if (!source) return DEFAULT_DOT;
  return SOURCE_DOT[source.toLowerCase()] ?? DEFAULT_DOT;
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

// ─── Bar ──────────────────────────────────────────────────────────────────────

interface BarProps {
  entry: DailyLeads;
  heightPct: number;
  index: number;
}

function Bar({ entry, heightPct, index }: BarProps) {
  const [hovered, setHovered] = useState(false);
  const bg = getBarBg(entry.source, hovered);

  return (
    <div
      className="flex flex-col items-center gap-1 flex-1 min-w-[20px] group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-full flex items-end justify-center h-full relative">
        {/* Tooltip */}
        <AnimatePresence>
          {hovered && entry.count > 0 && (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
            >
              <div
                className="rounded-md px-2 py-1 text-[10px] font-medium whitespace-nowrap"
                style={{
                  background: "rgba(0,0,0,0.85)",
                  border: "1px solid rgba(212,160,23,0.4)",
                  color: "#D4A017",
                }}
              >
                {entry.count} lead{entry.count !== 1 ? "s" : ""}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated bar */}
        <motion.div
          className="w-full rounded-t"
          style={{ background: bg, transition: "background 0.2s ease" }}
          initial={{ height: 0 }}
          animate={{
            height: `${Math.max(heightPct, entry.count > 0 ? 4 : 0)}%`,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            delay: index * 0.02,
          }}
        />
      </div>
    </div>
  );
}

// ─── LeadsChart ───────────────────────────────────────────────────────────────

export function LeadsChart({ data }: LeadsChartProps) {
  if (data.length === 0) {
    return (
      <motion.div
className="glass-card card-gold-glow rounded-xl p-6"
        variants={fadeUpSmall}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-base font-semibold text-foreground mb-1">
          Leads por Día
        </h2>
        <p className="text-xs text-muted-foreground mb-6">Últimos 30 días</p>
        <motion.div
          className="flex items-center justify-center h-40 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          No hay datos aún
        </motion.div>
      </motion.div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const uniqueSources = Array.from(
    new Set(data.map((d) => d.source).filter(Boolean))
  ) as string[];

  return (
    <motion.div
      className="glass-card rounded-xl p-6"
      variants={fadeUpSmall}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-base font-semibold text-foreground mb-1">
        Leads por Día
      </h2>
      <p className="text-xs text-muted-foreground mb-6">Últimos 30 días</p>

      {/* Chart area */}
      <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
        {data.map((entry, idx) => {
          const heightPct = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
          return (
            <Bar key={idx} entry={entry} heightPct={heightPct} index={idx} />
          );
        })}
      </div>

      {/* X axis labels */}
      <div className="flex items-start gap-1 overflow-x-auto mt-1">
        {data.map((entry, idx) => (
          <div key={idx} className="flex-1 min-w-[20px] text-center">
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
        <motion.div
          className="flex flex-wrap gap-3 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          {uniqueSources.map((src) => (
            <div key={src} className="flex items-center gap-1.5">
              <div className={`size-2.5 rounded-sm ${getDotClass(src)}`} />
              <span className="text-xs text-muted-foreground capitalize">
                {src}
              </span>
            </div>
          ))}
          {data.some((d) => !d.source) && (
            <div className="flex items-center gap-1.5">
              <div className={`size-2.5 rounded-sm ${DEFAULT_DOT}`} />
              <span className="text-xs text-muted-foreground">Sin fuente</span>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
