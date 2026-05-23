"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

interface TragosProduct {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  variants?: { name: string; priceDelta: number; default?: boolean }[];
}

export function TragoCard({ product }: { product: TragosProduct }) {
  const { addItem } = useCart();
  const [selectedVar, setSelectedVar] = useState(
    product.variants?.find((v) => v.default)?.name || product.variants?.[0]?.name || ""
  );
  const [added, setAdded] = useState(false);

  const basePrice = product.price ? parseFloat(product.price.replace(/[^0-9]/g, "")) : 6500;
  const variant = product.variants?.find((v) => v.name === selectedVar);
  const finalPrice = basePrice + (variant?.priceDelta ?? 0);

  const handleAdd = () => {
    const label = selectedVar ? ` - ${selectedVar}` : "";
    addItem({
      id: String(product.id),
      name: `${product.name}${label}`,
      price: finalPrice,
      emoji: "🍹",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const flavorEmoji: Record<string, string> = {
    Frutilla: "🍓", Durazno: "🍑", Ananá: "🍍",
    "Frutos Rojos": "🫐", Mixtos: "🍇",
  };
  const flavorName = product.name.replace("Tragos V.I.P ", "");
  const emoji = flavorEmoji[flavorName] || "🍹";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-[#ff007f]/30 bg-[rgba(255,0,127,0.05)] p-5 flex flex-col gap-3 hover:border-[#ff007f]/60 hover:shadow-[0_0_30px_rgba(255,0,127,0.15)] transition-all duration-300"
    >
      {/* Neon glow bg */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ff007f]/5 to-transparent pointer-events-none" />

      {/* Emoji + Name */}
      <div className="flex items-center gap-3 relative z-10">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h3 className="text-lg font-bold text-white drop-shadow-[0_0_10px_rgba(255,0,127,0.5)]">
            {flavorName}
          </h3>
          <p className="text-[10px] text-[#ff007f]/60 uppercase tracking-widest font-semibold">
            Tragos V.I.P
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-white/50 leading-relaxed relative z-10">
        Con muchas gomitas y salsas de caramelo
      </p>

      {/* Variant picker */}
      {product.variants && product.variants.length > 0 && (
        <div className="flex gap-2 relative z-10">
          {product.variants.map((v) => (
            <button
              key={v.name}
              onClick={() => setSelectedVar(v.name)}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                selectedVar === v.name
                  ? "bg-[#ff007f]/20 border-[#ff007f] text-[#ff007f] shadow-[0_0_10px_rgba(255,0,127,0.2)]"
                  : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
              )}
            >
              {v.name}
              <span className="block text-[10px] opacity-70">
                ${(basePrice + v.priceDelta).toLocaleString("es-AR")}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        className={cn(
          "relative z-10 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
          added
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-[#ff007f] text-white hover:bg-[#ff1a8c] shadow-[0_0_20px_rgba(255,0,127,0.3)] hover:shadow-[0_0_30px_rgba(255,0,127,0.5)]"
        )}
      >
        {added ? (
          <><Check className="h-4 w-4" /> Agregado</>
        ) : (
          <><ShoppingCart className="h-4 w-4" /> Agregar ${finalPrice.toLocaleString("es-AR")}</>
        )}
      </button>
    </motion.div>
  );
}
