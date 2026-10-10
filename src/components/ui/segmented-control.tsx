"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption = {
  id: string;
  label: ReactNode;
  count?: number;
};

/**
 * Animated segmented pill. `id` namespaces the framer `layoutId`, so two
 * controls must use distinct ids — or deliberately share one to animate the
 * thumb across instances.
 */
export function SegmentedControl({
  id,
  value,
  onChange,
  options,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-1",
        className
      )}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200",
              active ? "text-foreground" : "text-foreground/40 hover:text-foreground/70"
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${id}`}
                className="absolute inset-0 rounded-full border border-border bg-card"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {option.label}
              {option.count != null && (
                <span className={active ? "text-foreground/40" : "text-foreground/20"}>
                  ({option.count})
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
