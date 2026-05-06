import type { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  animateBorder?: boolean;
}

export function GlassPanel({ children, className = "", animateBorder = false }: GlassPanelProps) {
  return (
    <div
      className={`rounded-3xl p-8 sm:p-12 ${animateBorder ? "border-animated" : ""} ${className}`}
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(212,160,23,0.3)",
      }}
    >
      {children}
    </div>
  );
}
