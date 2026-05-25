"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type ProductFromAPI = {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  category: string;
  line: string;
  variants?: { name: string; priceDelta: number; default?: boolean }[];
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function TragosVIPPage() {
  const [products, setProducts] = useState<ProductFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappPhone, setWhatsappPhone] = useState("5493705241065");

  useEffect(() => {
    fetch("/api/products?available=true&category=tragos_vip")
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));

    // Obtener número de WhatsApp
    fetch("/api/whatsapp-phone")
      .then((r) => r.json())
      .then((d) => d.phone && setWhatsappPhone(d.phone))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0a0008, #0a0a0a)" }}>
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-amber-400 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Link>
      </div>

      {/* Hero */}
      <motion.div className="text-center px-4 py-8" variants={fadeUp} initial="hidden" animate="visible">
        <span className="text-6xl block mb-4">🍹</span>
        <h1 className="text-4xl sm:text-5xl font-black mb-3"
          style={{
            fontFamily: "var(--font-playfair), serif",
            background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
          Tragos V.I.P
        </h1>
        <p className="text-white/50 max-w-md mx-auto leading-relaxed">
          La línea premium para cerrar la noche. Disponibles con o sin crema.
        </p>
      </motion.div>

      {/* Grid */}
      <motion.div className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        {loading ? (
          <p className="col-span-full text-center text-white/30 py-20">Cargando...</p>
        ) : products.length === 0 ? (
          <p className="col-span-full text-center text-white/30 py-20">Próximamente</p>
        ) : (
          products.map((p) => {
            const basePrice = parseFloat(p.price || "0");
            return (
              <motion.div key={p.id} variants={fadeUp}
                className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(212,160,23,0.12)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(212,160,23,0.3)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(212,160,23,0.12)"}>
                {/* Emoji */}
                <div className="w-full h-36 rounded-xl flex items-center justify-center text-6xl"
                  style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.06), rgba(232,113,42,0.03))", border: "1px solid rgba(212,160,23,0.06)" }}>
                  🍹
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  {p.description && (
                    <p className="text-sm text-white/50 mt-1 leading-relaxed">{p.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-black"
                    style={{
                      background: "linear-gradient(135deg, #D4A017, #F5A623)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}>
                    ${basePrice.toLocaleString("es-AR")}
                  </span>
                  <a href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent("Hola! Quiero info sobre " + p.name)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #D4A017, #F5A623)",
                      color: "#000",
                    }}>
                    Consultar
                  </a>
                </div>

                {/* Variants */}
                {p.variants && p.variants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.variants.map((v) => (
                      <span key={v.name}
                        className="text-[10px] px-2 py-1 rounded-full"
                        style={{
                          background: v.default ? "rgba(212,160,23,0.15)" : "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(212,160,23,0.12)",
                          color: v.default ? "#D4A017" : "rgba(255,255,255,0.4)",
                        }}>
                        {v.name} {v.priceDelta > 0 ? `+$${v.priceDelta}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
