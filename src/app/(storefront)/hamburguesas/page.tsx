"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Search, Smartphone } from "lucide-react";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductToggle } from "@/components/products/product-toggle";
import { UpsellModal } from "@/components/products/upsell-modal";
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
  const productsRef = useRef<HTMLDivElement>(null);

  const handleNavigateToPapas = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  const lineOptions = [
    { id: "pollo", label: "Línea Pollo" },
    { id: "carne", label: "Línea Carne" },
  ].filter((o) => products.some((p) => p.line === o.id));

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
            className="text-xs font-semibold uppercase tracking-[0.3em] text-primary"
          >
            El Menú
          </motion.span>
          <motion.h1
            variants={heroChild}
            className="text-gold-shimmer text-4xl sm:text-5xl font-black font-heading"
          >
            Nuestras <em className="marker-gold">Hamburguesas</em>
          </motion.h1>
          <motion.p
            variants={heroChild}
            className="text-foreground/60 max-w-lg leading-relaxed"
          >
            Cada una tiene su propia historia. Elegí tu línea y descubrí la que te va a conquistar.
          </motion.p>

          <motion.div variants={heroChild} className="mt-4">
            <ProductToggle value={linea} onChange={setLinea} showAll options={lineOptions} />
          </motion.div>
        </motion.div>
      </PageHero>

      <div className="bg-background relative pb-20 px-4">
        <div className="max-w-7xl mx-auto pt-16">
          {/* Search */}
          <motion.div
            className="relative mb-8 max-w-md mx-auto"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
            <Input
              placeholder="Buscá tu hamburguesa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring/50 focus-visible:border-primary/50"
            />
          </motion.div>

          <div ref={productsRef}>
            {!loading && <ProductGrid products={filteredProducts} />}
          </div>
        </div>
      </div>

      <ParallaxDivider image="/assets/images/background/3.png" height="35vh" />

      {/* Digital Menu CTA */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            className="flex flex-col items-center gap-4"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-xl font-bold text-foreground mb-1 font-heading">
              Pedí directo desde la Carta Digital
            </h2>
            <p className="text-sm text-foreground/50 mb-3">
              Deslizá productos, armá tu pedido y enviá por WhatsApp al toque
            </p>
            <a href="/carta-digital" className="cta-card w-full max-w-md text-left">
              <span className="cta-card-icon"><Smartphone size={20} aria-hidden="true" /></span>
              <span className="flex-1">
                <span className="block text-[17px] font-bold leading-tight">Abrir Carta Digital</span>
                <span className="block text-xs opacity-70">Pedí directo por WhatsApp</span>
              </span>
              <span className="cta-card-chevron"><ChevronRight size={20} aria-hidden="true" /></span>
            </a>
          </motion.div>
        </div>
      </section>

      <div className="bg-background py-16 px-4">
        <motion.div
          className="max-w-7xl mx-auto flex flex-col items-center gap-4 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <p className="text-foreground/60 text-sm">
            ¿Ya elegiste? Hacé tu pedido directo por WhatsApp
          </p>
          <WhatsAppCTA
            campaignSlug="hamburguesas"
            message="Hola! Me gustaría hacer un pedido de hamburguesas"
            label="Hacer Pedido"
          />
        </motion.div>
      </div>

      <UpsellModal onNavigateToPapas={handleNavigateToPapas} />
    </>
  );
}
