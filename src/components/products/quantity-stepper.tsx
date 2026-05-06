"use client";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({ value, onChange, min = 1, max = 99 }: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-lg overflow-hidden border border-white/10"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition-colors border-none bg-transparent cursor-pointer"
      >
        <Minus className="w-3.5 h-3.5" />
      </motion.button>
      <motion.span
        key={value}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className="w-8 text-center text-sm font-semibold text-white"
      >
        {value}
      </motion.span>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition-colors border-none bg-transparent cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
      </motion.button>
    </div>
  );
}
