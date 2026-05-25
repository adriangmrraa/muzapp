"use client";

import { useState, useMemo, useEffect, useRef } from "react";

interface Product {
  id: number;
  name: string;
  price: string | null;
  imageUrl: string | null;
  category: string;
  line: string;
  description: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const CATEGORIES = [
  { key: "hamburguesa", label: "Hamburguesas", emoji: "🍔", gradient: "from-amber-900/40 via-red-950/30 to-transparent", glow: "rgba(212,160,23,0.15)", bgEmoji: "🍔" },
  { key: "acompanamiento", label: "Acompañamientos", emoji: "🍟", gradient: "from-orange-900/40 via-amber-950/30 to-transparent", glow: "rgba(234,88,12,0.12)", bgEmoji: "🍟" },
  { key: "bebidas", label: "Bebidas", emoji: "🥤", gradient: "from-cyan-900/30 via-blue-950/20 to-transparent", glow: "rgba(6,182,212,0.1)", bgEmoji: "🥤" },
  { key: "pan_mayorista", label: "Pan Mayorista", emoji: "🍞", gradient: "from-amber-800/35 via-yellow-950/25 to-transparent", glow: "rgba(217,119,6,0.12)", bgEmoji: "🍞" },
  { key: "tragos_vip", label: "Tragos V.I.P", emoji: "🍹", gradient: "from-pink-900/35 via-purple-950/25 to-transparent", glow: "rgba(236,72,153,0.1)", bgEmoji: "🍹" },
];

const emojiMap: Record<string, string> = {
  hamburguesa: "🍔", acompanamiento: "🍟", bebidas: "🥤",
  pan_mayorista: "🍞", tragos_vip: "🍹",
};

function getImageUrl(product: Product): string | null {
  if (!product.imageUrl) return null;
  if (product.imageUrl.startsWith("http")) return product.imageUrl;
  return null;
}

export function MenuDigitalClient({
  products,
  whatsappPhone,
}: {
  products: Product[];
  whatsappPhone: string;
}) {
  const [activeCat, setActiveCat] = useState("hamburguesa");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => CATEGORIES.filter((c) => products.some((p) => p.category === c.key)),
    [products]
  );

  const filtered = useMemo(
    () => products.filter((p) => p.category === activeCat),
    [products, activeCat]
  );

  const total = useMemo(
    () => cart.reduce((s, i) => s + parseFloat(i.product.price || "0") * i.quantity, 0),
    [cart]
  );

  const count = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const catInfo = CATEGORIES.find((c) => c.key === activeCat) || CATEGORIES[0];

  // Animar entrada de productos
  useEffect(() => {
    setVisibleItems(new Set());
    const timer = setTimeout(() => {
      setVisibleItems(new Set(filtered.map((p) => p.id)));
    }, 100);
    return () => clearTimeout(timer);
  }, [activeCat, filtered]);

  const add = (p: Product) => setCart((prev) => {
    const ex = prev.find((i) => i.product.id === p.id);
    return ex
      ? prev.map((i) => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...prev, { product: p, quantity: 1 }];
  });

  const remove = (id: number) => setCart((prev) => {
    const ex = prev.find((i) => i.product.id === id);
    if (ex && ex.quantity > 1) return prev.map((i) => i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i);
    return prev.filter((i) => i.product.id !== id);
  });

  const send = () => {
    if (!cart.length) return;
    const lines = cart.map((i) =>
      `• ${i.quantity}x ${i.product.name.trim()} — $${(parseFloat(i.product.price || "0") * i.quantity).toLocaleString("es-AR")}`
    );
    const msg = ["🛵 *Nuevo Pedido*", "", ...lines, "", `💰 *Total: $${total.toLocaleString("es-AR")}*`].join("\n");
    window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    setOrderSent(true);
    setTimeout(() => setOrderSent(false), 3000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#fff",
      fontFamily: "'Space Grotesk', sans-serif",
      paddingBottom: "100px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* ── HEADER ── */}
      <div style={{
        position: "relative",
        padding: "52px 24px 32px",
        textAlign: "center",
        overflow: "hidden",
        background: "linear-gradient(180deg, #0f0800 0%, #080808 100%)",
        borderBottom: "1px solid rgba(212,160,23,0.08)",
      }}>
        {/* Glow orbs animados */}
        <div style={{
          position: "absolute", width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,160,23,0.08), transparent 70%)",
          top: "-200px", right: "-100px", pointerEvents: "none",
          animation: "orbFloat 20s infinite ease-in-out",
        }} />
        <div style={{
          position: "absolute", width: "350px", height: "350px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,113,42,0.05), transparent 70%)",
          bottom: "-100px", left: "-80px", pointerEvents: "none",
          animation: "orbFloat 25s infinite ease-in-out reverse",
        }} />
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, letterSpacing: "-0.5px", margin: 0, position: "relative", zIndex: 1 }}>
          <span style={{ color: "#D4A017" }}>Mrs</span>{" "}
          <span style={{ color: "#fff" }}>Muzzarella</span>
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", marginTop: "6px", position: "relative", zIndex: 1 }}>
          Deslizá, armá tu pedido y pedilo por WhatsApp
        </p>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div style={{
        display: "flex", gap: "8px", padding: "16px 16px 12px",
        overflowX: "auto", scrollbarWidth: "none",
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(8,8,8,0.9)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        {categories.map((cat) => (
          <button key={cat.key} onClick={() => setActiveCat(cat.key)}
            style={{
              padding: "10px 20px", borderRadius: "100px", border: "none",
              background: activeCat === cat.key
                ? "linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.08))"
                : "rgba(255,255,255,0.04)",
              color: activeCat === cat.key ? "#D4A017" : "rgba(255,255,255,0.45)",
              fontSize: "14px", fontWeight: activeCat === cat.key ? 600 : 450,
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.3s ease",
              fontFamily: "inherit",
              boxShadow: activeCat === cat.key ? "0 4px 20px rgba(212,160,23,0.15)" : "none",
            }}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* ── CATEGORY BACKGROUND ── */}
      <div style={{
        position: "relative",
        background: `linear-gradient(135deg, ${catInfo.gradient})`,
        transition: "background 0.5s ease",
      }}>
        {/* Background emoji gigante */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          fontSize: "300px", opacity: 0.03, pointerEvents: "none", userSelect: "none",
          transition: "all 0.5s ease",
          textShadow: `0 0 60px ${catInfo.glow}`,
        }}>
          {catInfo.bgEmoji}
        </div>

        {/* ── PRODUCTS SCROLL ── */}
        <div ref={scrollRef} style={{
          display: "flex", gap: "20px", padding: "28px 20px",
          overflowX: "auto", scrollSnapType: "x mandatory",
          scrollbarWidth: "none", position: "relative", zIndex: 1,
        }}>
          {filtered.map((product, idx) => {
            const imgUrl = getImageUrl(product);
            const inCart = cart.find((i) => i.product.id === product.id);
            const qty = inCart?.quantity || 0;
            const isVisible = visibleItems.has(product.id);
            const delay = idx * 0.08;

            return (
              <div key={product.id} style={{
                minWidth: "300px", maxWidth: "340px",
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: "28px",
                padding: "24px",
                scrollSnapAlign: "start",
                display: "flex", flexDirection: "column", gap: "16px",
                flexShrink: 0,
                transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(30px)",
                transitionDelay: `${delay}s`,
                border: "1px solid rgba(212,160,23,0.06)",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px) scale(1.01)";
                  e.currentTarget.style.boxShadow = "0 16px 60px rgba(0,0,0,0.6), 0 0 30px rgba(212,160,23,0.1), inset 0 1px 0 rgba(255,255,255,0.08)";
                  e.currentTarget.style.borderColor = "rgba(212,160,23,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(212,160,23,0.06)";
                }}>
                {/* Image */}
                <div style={{
                  width: "100%", height: "180px", borderRadius: "20px",
                  background: `linear-gradient(135deg, ${catInfo.glow}, rgba(0,0,0,0.2))`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", position: "relative",
                  boxShadow: "inset 0 2px 12px rgba(0,0,0,0.2)",
                }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s" }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.transform = "scale(1.08)"}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.transform = "scale(1)"}
                      onError={(e) => { const el = e.currentTarget; el.style.display = "none"; const p = el.parentElement; if (p) p.innerHTML = `<span style="font-size:72px;opacity:0.3;">${emojiMap[product.category] || "📦"}</span>`; }} />
                  ) : (
                    <span style={{ fontSize: "72px", opacity: 0.25, animation: "float 4s ease-in-out infinite" }}>
                      {emojiMap[product.category] || "📦"}
                    </span>
                  )}
                </div>

                {/* Name + Desc */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#fff", letterSpacing: "-0.3px" }}>
                    {product.name.trim()}
                  </h3>
                  {product.description && (
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "6px 0 0", lineHeight: 1.4 }}>
                      {product.description.trim()}
                    </p>
                  )}
                </div>

                {/* Price + Actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <span style={{
                    fontSize: "26px", fontWeight: 800,
                    background: "linear-gradient(135deg, #D4A017, #F5A623)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>
                    ${parseFloat(product.price || "0").toLocaleString("es-AR")}
                  </span>
                  {qty > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button onClick={() => remove(product.id)}
                        style={{ width: "38px", height: "38px", borderRadius: "50%", border: "none",
                          background: "rgba(255,255,255,0.06)", color: "#D4A017", fontSize: "18px", fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,160,23,0.15)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>−</button>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: "#fff", minWidth: "22px", textAlign: "center" }}>{qty}</span>
                      <button onClick={() => add(product)}
                        style={{ width: "38px", height: "38px", borderRadius: "50%", border: "none",
                          background: "#D4A017", color: "#000", fontSize: "18px", fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit",
                          boxShadow: "0 4px 16px rgba(212,160,23,0.25)" }}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => add(product)}
                      style={{ padding: "12px 24px", borderRadius: "100px", border: "none",
                        background: "linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.08))",
                        color: "#D4A017", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit", transition: "all 0.3s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,160,23,0.3), rgba(212,160,23,0.15))"; e.currentTarget.style.transform = "scale(1.03)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.08))"; e.currentTarget.style.transform = "scale(1)"; }}>
                      + Agregar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.2)" }}>
            <p style={{ fontSize: "16px" }}>Próximamente</p>
          </div>
        )}
      </div>

      {/* ── FLOATING CART ── */}
      {count > 0 && !cartOpen && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 100 }}>
          <button onClick={() => setCartOpen(true)}
            style={{
              padding: "18px 36px", borderRadius: "100px", border: "none",
              background: "linear-gradient(135deg, #D4A017, #F5A623)",
              color: "#000", fontSize: "16px", fontWeight: 700, cursor: "pointer",
              boxShadow: "0 8px 40px rgba(212,160,23,0.35)",
              display: "flex", alignItems: "center", gap: "12px", fontFamily: "inherit",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 12px 50px rgba(212,160,23,0.45)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(212,160,23,0.35)"; }}>
            🛒 {count} {count === 1 ? "item" : "items"}
            <span style={{ opacity: 0.8, fontWeight: 600 }}>${total.toLocaleString("es-AR")}</span>
          </button>
        </div>
      )}

      {/* ── CART DRAWER (same as before, simplified) ── */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", background: "#080808" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#fff" }}>🛒 Tu pedido</h2>
            <button onClick={() => setCartOpen(false)}
              style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", fontSize: "16px", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {!cart.length ? (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", padding: "40px", fontSize: "14px" }}>No agregaste productos todavía</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {cart.map((item) => (
                  <div key={item.product.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", borderRadius: "20px", background: "rgba(255,255,255,0.03)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "#fff" }}>{item.product.name.trim()}</p>
                      <p style={{ fontSize: "13px", color: "#D4A017", fontWeight: 600, margin: "3px 0 0" }}>
                        ${(parseFloat(item.product.price || "0") * item.quantity).toLocaleString("es-AR")}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => remove(item.product.id)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>−</button>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff", minWidth: "18px", textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => add(item.product)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "#D4A017", color: "#000", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>Total</span>
              <span style={{ fontSize: "26px", fontWeight: 800, background: "linear-gradient(135deg, #D4A017, #F5A623)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                ${total.toLocaleString("es-AR")}
              </span>
            </div>
            <button onClick={send} disabled={!cart.length}
              style={{
                width: "100%", padding: "18px", borderRadius: "100px", border: "none",
                background: !cart.length ? "rgba(212,160,23,0.15)" : "linear-gradient(135deg, #D4A017, #F5A623)",
                color: !cart.length ? "rgba(255,255,255,0.3)" : "#000",
                fontSize: "16px", fontWeight: 700, cursor: !cart.length ? "default" : "pointer",
                fontFamily: "inherit", transition: "all 0.3s ease",
              }}>
              {orderSent ? "✅ Pedido enviado!" : "📤 Enviar pedido por WhatsApp"}
            </button>
          </div>
        </div>
      )}

      {/* ── ANIMATIONS ── */}
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
