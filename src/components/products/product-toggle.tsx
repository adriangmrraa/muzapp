"use client";

import { motion } from "framer-motion";

interface ProductToggleProps {
  value: string;
  onChange: (value: string) => void;
  showAll?: boolean;
  options?: { id: string; label: string }[];
}

const DEFAULT_OPTIONS = [
  { id: "pollo", label: "Línea Pollo" },
  { id: "carne", label: "Línea Carne" },
];

export function ProductToggle({ value, onChange, showAll = false, options }: ProductToggleProps) {
  const TABS = [
    ...(showAll ? [{ id: "todas" as const, label: "Todas" }] : []),
    ...(options ?? DEFAULT_OPTIONS),
  ];

  return (
    <div className="relative inline-flex rounded-full p-1 bg-black/50 border border-primary/30">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
            value === tab.id ? "text-primary-foreground" : "text-foreground/60"
          }`}
        >
          {value === tab.id && (
            <motion.div
              layoutId="toggle-pill"
              className="absolute inset-0 rounded-full bg-gradient-to-br from-gold via-gold-bright to-gold-ember shadow-[0_4px_15px_rgba(212,160,23,0.4)]"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
