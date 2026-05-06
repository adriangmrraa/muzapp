"use client";

import { Star } from "lucide-react";

export function SellerBadge() {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl w-fit"
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(212,160,23,0.3)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
        style={{
          background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
        }}
      >
        <span role="img" aria-label="burger">🍔</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <p
          className="text-sm font-bold leading-tight"
          style={{
            fontFamily: "var(--font-playfair), serif",
            background: "linear-gradient(135deg, #D4A017, #F5A623)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Mrs Muzzarella
        </p>
        <p className="text-[11px] text-white/50 leading-tight">
          Rotisería Premium en Formosa
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs font-bold text-white mr-1">5.0</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="w-3 h-3"
              style={{ fill: "#D4A017", color: "#D4A017" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
