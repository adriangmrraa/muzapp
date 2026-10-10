"use client";

import { Star } from "lucide-react";
import { useBusiness } from "@/lib/hooks/use-business";

export function SellerBadge() {
  const business = useBusiness();
  return (
    <div className="glass-card flex items-center gap-3 p-3 rounded-xl w-fit">
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 bg-gradient-to-br from-gold via-gold-bright to-gold-ember">
        <span role="img" aria-label="burger">🍔</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold leading-tight font-heading text-gold-gradient">
          {business?.name || "Tienda"}
        </p>
        <p className="text-[11px] text-foreground/50 leading-tight">
          {business?.tagline || "Pedidos online"}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs font-bold text-foreground mr-1">5.0</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="w-3 h-3 fill-primary text-primary"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
