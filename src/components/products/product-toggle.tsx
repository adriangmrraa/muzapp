"use client";

import { motion } from "framer-motion";

interface ProductToggleProps {
  value: "pollo" | "carne";
  onChange: (value: "pollo" | "carne") => void;
}

const TABS = [
  { id: "pollo" as const, label: "Línea Pollo" },
  { id: "carne" as const, label: "Línea Carne" },
];

export function ProductToggle({ value, onChange }: ProductToggleProps) {
  return (
    <div
      className="relative inline-flex rounded-full p-1"
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(212,160,23,0.3)",
      }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300"
          style={{ color: value === tab.id ? "#0a0a0a" : "rgba(255,255,255,0.6)" }}
        >
          {value === tab.id && (
            <motion.div
              layoutId="toggle-pill"
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                boxShadow: "0 4px 15px rgba(212,160,23,0.4)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
