"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductToggle } from "@/components/products/product-toggle";
import { Input } from "@/components/ui/input";
import { WhatsAppCTA } from "@/components/attribution/whatsapp-cta";
import { fadeUp, staggerContainer, heroChild } from "@/lib/animation-variants";
import { PageHero } from "@/components/layout/page-hero";
import { ParallaxDivider } from "@/components/layout/parallax-divider";

type ProductFromAPI = {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  category: string;
  line: string;
  imageUrl: string | null;
  available: boolean;
  comingSoon: boolean;
  sortOrder: number;
};

export default function HamburguesasPage() {
  const [linea, setLinea] = useState<string>("todas");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductFromAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products?available=true");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("[hamburgesas] fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (linea !== "todas") {
      result = result.filter((p) => p.line === linea);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [products, linea, search]);

  return (
    <>
      <PageHero backgroundImage="/assets/images/background/1.png">
        <motion.div
          className="flex flex-col items-center text-center gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.span
            variants={heroChild}
            className="text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: "#D4A017" }}
          >
            El Menú
          </motion.span>
          <motion.h1
            variants={heroChild}
            className="text-4xl sm:text-5xl font-black"
            style={{
              fontFamily: "var(--font-playfair), serif",
              background:
                "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Nuestras Hamburguesas
          </motion.h1>
          <motion.p
            variants={heroChild}
            className="text-white/60 max-w-lg leading-relaxed"
          >
            Cada una tiene su propia historia. Elegí tu línea y descubrí la que te va a conquistar.
          </motion.p>

          <motion.div variants={heroChild} className="mt-4">
            <ProductToggle value={linea} onChange={setLinea} showAll />
          </motion.div>
        </motion.div>
      </PageHero>

      <div className="bg-[#0a0a0a] relative pb-20 px-4">
        <div className="max-w-7xl mx-auto pt-16">
          {/* Search */}
          <motion.div
            className="relative mb-8 max-w-md mx-auto"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <Input
              placeholder="Buscá tu hamburguesa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#D4A017]/50 focus-visible:border-[#D4A017]/50"
            />
          </motion.div>

          {!loading && <ProductGrid products={filteredProducts} />}
        </div>
      </div>

      <ParallaxDivider image="/assets/images/background/3.png" height="35vh" />

      <div className="bg-[#0a0a0a] py-16 px-4">
        <motion.div
          className="max-w-7xl mx-auto flex flex-col items-center gap-4 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <p className="text-white/60 text-sm">
            ¿Ya elegiste? Hacé tu pedido directo por WhatsApp
          </p>
          <WhatsAppCTA
            campaignSlug="hamburguesas"
            message="Hola! Me gustaría hacer un pedido de hamburguesas"
            label="Hacer Pedido"
          />
        </motion.div>
      </div>
    </>
  );
}
