import type { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  animateBorder?: boolean;
}

export function GlassPanel({ children, className = "", animateBorder = false }: GlassPanelProps) {
  return (
    <div
      className={`glass-card rounded-3xl p-8 sm:p-12 ${animateBorder ? "border-animated" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
