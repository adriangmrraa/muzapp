"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { TragoHero } from "@/components/tragos-vip/trago-hero";
import { TragoCard } from "@/components/tragos-vip/trago-card";
import { ArrowLeft, ShoppingBag } from "lucide-react";

type ProductFromAPI = {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  category: string;
  line: string;
  variants?: { name: string; priceDelta: number; default?: boolean }[];
};

export default function TragosVIPPage() {
  const [products, setProducts] = useState<ProductFromAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?available=true&category=tragos_vip")
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0008]">
      {/* Back / Nav */}
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/hamburguesas"
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al menú
        </Link>
        <Link
          href="/hamburguesas"
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Ver hamburguesas
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4">
        <TragoHero />
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-semibold text-[#ff007f]/60 uppercase tracking-[0.2em] mb-8 text-center"
        >
          — Sabores —
        </motion.h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 border-2 border-[#ff007f]/30 border-t-[#ff007f] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <TragoCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <p className="text-center text-white/30 py-20">Próximamente...</p>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-[#ff007f]/10 py-8 text-center">
        <p className="text-xs text-white/30">
          Tragos V.I.P — Colaboración exclusiva Mrs Muzzarella
        </p>
      </div>
    </div>
  );
}
