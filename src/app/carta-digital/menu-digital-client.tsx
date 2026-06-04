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

type CartItem =
  | { type: "product"; id: string; data: Product; quantity: number }
  | { type: "promo"; id: string; data: Promo; quantity: number };

interface Promo {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  customPrice: string | null;
  items: { productId: number; productName: string; quantity: number }[] | null;
}

type ItemDetail =
  | { type: "product"; data: Product }
  | { type: "promo"; data: Promo };

const CATEGORIES = [
  { key: "promos", label: "Promos", emoji: "⭐", gradient: "from-yellow-800/40 via-amber-950/30 to-transparent", glow: "rgba(250,204,21,0.18)", bgEmoji: "⭐" },
  { key: "hamburguesa", label: "Hamburguesas", emoji: "🍔", gradient: "from-amber-900/40 via-red-950/30 to-transparent", glow: "rgba(212,160,23,0.15)", bgEmoji: "🍔" },
  { key: "acompanamiento", label: "Acompañamientos", emoji: "🍟", gradient: "from-orange-900/40 via-amber-950/30 to-transparent", glow: "rgba(234,88,12,0.12)", bgEmoji: "🍟" },
  { key: "bebidas", label: "Bebidas", emoji: "🥤", gradient: "from-cyan-900/30 via-blue-950/20 to-transparent", glow: "rgba(6,182,212,0.1)", bgEmoji: "🥤" },
  { key: "pan_mayorista", label: "Pan Mayorista", emoji: "🍞", gradient: "from-amber-800/35 via-yellow-950/25 to-transparent", glow: "rgba(217,119,6,0.12)", bgEmoji: "🍞" },
  { key: "tragos_vip", label: "Tragos V.I.P", emoji: "🍹", gradient: "from-pink-900/35 via-purple-950/25 to-transparent", glow: "rgba(236,72,153,0.1)", bgEmoji: "🍹" },
];

const emojiMap: Record<string, string> = {
  promos: "⭐", hamburguesa: "🍔", acompanamiento: "🍟", bebidas: "🥤",
  pan_mayorista: "🍞", tragos_vip: "🍹",
};

function getImageUrl(product: Product): string | null {
  if (!product.imageUrl) return null;
  if (product.imageUrl.startsWith("http")) return product.imageUrl;
  return null;
}

export function MenuDigitalClient({
  products,
  promos,
  whatsappPhone,
}: {
  products: Product[];
  promos: Promo[];
  whatsappPhone: string;
}) {
  const [activeCat, setActiveCat] = useState("promos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => CATEGORIES.filter((c) => c.key === "promos" || products.some((p) => p.category === c.key)),
    [products]
  );

  const filtered = useMemo(
    () => products.filter((p) => p.category === activeCat),
    [products, activeCat]
  );

  const total = useMemo(
    () => cart.reduce((s, i) => {
      if (i.type === "product") return s + parseFloat(i.data.price || "0") * i.quantity;
      return s + parseFloat(i.data.customPrice || "0") * i.quantity;
    }, 0),
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

  const addProduct = (p: Product) => setCart((prev) => {
    const id = "product-" + p.id;
    const ex = prev.find((i) => i.id === id);
    return ex
      ? prev.map((i) => i.id === id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...prev, { type: "product", id, data: p, quantity: 1 } as CartItem];
  });

  const addPromo = (promo: Promo) => setCart((prev) => {
    const id = "promo-" + promo.id;
    const ex = prev.find((i) => i.id === id);
    return ex
      ? prev.map((i) => i.id === id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...prev, { type: "promo", id, data: promo, quantity: 1 } as CartItem];
  });

  const remove = (id: string) => setCart((prev) => {
    const ex = prev.find((i) => i.id === id);
    if (ex && ex.quantity > 1) return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
    return prev.filter((i) => i.id !== id);
  });

  const send = () => {
    if (!cart.length) return;
    const lines = cart.map((i) => {
      if (i.type === "product") {
        return `• ${i.quantity}x ${i.data.name.trim()} — $${(parseFloat(i.data.price || "0") * i.quantity).toLocaleString("es-AR")}`;
      }
      const price = (parseFloat(i.data.customPrice || "0") * i.quantity).toLocaleString("es-AR");
      const itemsIncluded = (i.data.items || []).map((item) => `  ${item.quantity}x ${item.productName}`).join("\n");
      const line = `• 🔥 ${i.quantity}x ${i.data.name.trim()} — $${price}`;
      return itemsIncluded ? `${line}\n${itemsIncluded}` : line;
    });
    const msg = ["🛵 *Nuevo Pedido*", "", ...lines, "", `💰 *Total: $${total.toLocaleString("es-AR")}*`].join("\n");
    window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    setOrderSent(true);
    setTimeout(() => setOrderSent(false), 3000);
  };

  // Cerrar modal con ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedItem(null);
    };
    if (selectedItem) {
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [selectedItem]);

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
      <div className="header-padding" style={{
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
          <button key={cat.key} onClick={() => setActiveCat(cat.key)} className="cat-tab"
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
        <div className="bg-emoji" style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          fontSize: "300px", opacity: 0.03, pointerEvents: "none", userSelect: "none",
          transition: "all 0.5s ease",
          textShadow: `0 0 60px ${catInfo.glow}`,
        }}>
          {catInfo.bgEmoji}
        </div>

        {activeCat === "promos" ? (
          /* ── PROMOS SCROLL ── */
          <div style={{
            display: "flex", gap: "20px", padding: "28px 20px",
            overflowX: "auto", scrollSnapType: "x mandatory",
            scrollbarWidth: "none", position: "relative", zIndex: 1,
          }}>
            {promos.map((promo, idx) => {
              const imgUrl = promo.imageUrl && (promo.imageUrl.startsWith("http") ? promo.imageUrl : null);
              const delay = idx * 0.08;

              return (
                <div key={promo.id} className="product-card" style={{
                  minWidth: "300px", maxWidth: "340px",
                  background: "linear-gradient(135deg, rgba(250,204,21,0.04), rgba(212,160,23,0.02))",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderRadius: "28px",
                  padding: "24px",
                  scrollSnapAlign: "start",
                  display: "flex", flexDirection: "column", gap: "16px",
                  flexShrink: 0,
                  cursor: "pointer",
                  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(250,204,21,0.06)",
                  border: "1px solid rgba(250,204,21,0.08)",
                }}
                  onClick={() => setSelectedItem({ type: "promo", data: promo })}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.01)";
                    e.currentTarget.style.boxShadow = "0 16px 60px rgba(0,0,0,0.6), 0 0 40px rgba(250,204,21,0.1), inset 0 1px 0 rgba(250,204,21,0.08)";
                    e.currentTarget.style.borderColor = "rgba(250,204,21,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(250,204,21,0.06)";
                    e.currentTarget.style.borderColor = "rgba(250,204,21,0.08)";
                  }}>
                  {/* Promo Image */}
                  <div className="product-image" style={{
                    width: "100%", height: "180px", borderRadius: "20px",
                    background: `linear-gradient(135deg, rgba(250,204,21,0.1), rgba(0,0,0,0.2))`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", position: "relative",
                    boxShadow: "inset 0 2px 12px rgba(0,0,0,0.2)",
                  }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={promo.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s" }}
                        onMouseEnter={(e) => (e.target as HTMLElement).style.transform = "scale(1.08)"}
                        onMouseLeave={(e) => (e.target as HTMLElement).style.transform = "scale(1)"}
                        onError={(e) => { const el = e.currentTarget; el.style.display = "none"; const p = el.parentElement; if (p) p.innerHTML = '<span style="font-size:72px;opacity:0.3;">⭐</span>'; }} />
                    ) : (
                      <span style={{ fontSize: "72px", opacity: 0.25, animation: "float 4s ease-in-out infinite" }}>⭐</span>
                    )}
                    {/* Badge PROMO */}
                    <div style={{
                      position: "absolute", top: "12px", left: "12px",
                      padding: "4px 14px", borderRadius: "100px",
                      background: "linear-gradient(135deg, #EAB308, #CA8A04)",
                      color: "#000", fontSize: "11px", fontWeight: 800,
                      letterSpacing: "0.5px", textTransform: "uppercase",
                    }}>
                      PROMO
                    </div>
                  </div>

                  {/* Name + Desc */}
                  <div style={{ flex: 1 }}>
                    <h3 className="product-name" style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#fff", letterSpacing: "-0.3px" }}>
                      {promo.name.trim()}
                    </h3>
                    {promo.description && (
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "6px 0 0", lineHeight: 1.4 }}>
                        {promo.description.trim()}
                      </p>
                    )}
                  </div>

                  {/* Items included */}
                  {promo.items && promo.items.length > 0 && (
                    <div style={{
                      padding: "12px 14px", borderRadius: "16px",
                      background: "rgba(250,204,21,0.04)",
                      border: "1px solid rgba(250,204,21,0.06)",
                    }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(250,204,21,0.5)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Incluye:
                      </p>
                      {promo.items.map((item, i) => (
                        <p key={i} style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: "2px 0" }}>
                          {item.quantity}x {item.productName}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Price + CTA */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <span className="product-price" style={{
                      fontSize: "26px", fontWeight: 800,
                      background: "linear-gradient(135deg, #EAB308, #F5A623)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>
                      {promo.customPrice
                        ? `$${parseFloat(promo.customPrice).toLocaleString("es-AR")}`
                        : "Consultar"}
                    </span>
                    {(() => {
                      const inCart = cart.find((i): i is CartItem & { type: "promo" } => i.type === "promo" && i.data.id === promo.id);
                      const qty = inCart?.quantity || 0;
                      return qty > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button onClick={(e) => { e.stopPropagation(); remove("promo-" + promo.id); }}
                            style={{ width: "38px", height: "38px", borderRadius: "50%", border: "none",
                              background: "rgba(255,255,255,0.06)", color: "#EAB308", fontSize: "18px", fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit" }}>−</button>
                          <span style={{ fontSize: "16px", fontWeight: 600, color: "#fff", minWidth: "22px", textAlign: "center" }}>{qty}</span>
                          <button onClick={(e) => { e.stopPropagation(); addPromo(promo); }}
                            style={{ width: "38px", height: "38px", borderRadius: "50%", border: "none",
                              background: "#EAB308", color: "#000", fontSize: "18px", fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit",
                              boxShadow: "0 4px 16px rgba(234,179,8,0.25)" }}>+</button>
                        </div>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); addPromo(promo); }}
                          style={{ padding: "12px 24px", borderRadius: "100px", border: "none",
                            background: "linear-gradient(135deg, #EAB308, #CA8A04)",
                            color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                            fontFamily: "inherit", transition: "all 0.3s ease",
                            boxShadow: "0 4px 20px rgba(234,179,8,0.25)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 6px 30px rgba(234,179,8,0.35)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(234,179,8,0.25)"; }}>
                          + Agregar
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── PRODUCTS SCROLL ── */
          <div ref={scrollRef} style={{
            display: "flex", gap: "20px", padding: "28px 20px",
            overflowX: "auto", scrollSnapType: "x mandatory",
            scrollbarWidth: "none", position: "relative", zIndex: 1,
          }}>
            {filtered.map((product, idx) => {
              const imgUrl = getImageUrl(product);
              const inCart = cart.find((i): i is CartItem & { type: "product" } => i.type === "product" && i.data.id === product.id);
              const qty = inCart?.quantity || 0;
              const isVisible = visibleItems.has(product.id);
              const delay = idx * 0.08;

              return (
                <div key={product.id} className="product-card" style={{
                  minWidth: "300px", maxWidth: "340px",
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderRadius: "28px",
                  padding: "24px",
                  scrollSnapAlign: "start",
                  display: "flex", flexDirection: "column", gap: "16px",
                  flexShrink: 0,
                  cursor: "pointer",
                  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(30px)",
                  transitionDelay: `${delay}s`,
                  border: "1px solid rgba(212,160,23,0.06)",
                }}
                  onClick={() => setSelectedItem({ type: "product", data: product })}
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
                  <div className="product-image" style={{
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
                    <h3 className="product-name" style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#fff", letterSpacing: "-0.3px" }}>
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
                    <span className="product-price" style={{
                      fontSize: "26px", fontWeight: 800,
                      background: "linear-gradient(135deg, #D4A017, #F5A623)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>
                      ${parseFloat(product.price || "0").toLocaleString("es-AR")}
                    </span>
                    {qty > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button onClick={(e) => { e.stopPropagation(); remove("product-" + product.id); }}
                        style={{ width: "38px", height: "38px", borderRadius: "50%", border: "none",
                          background: "rgba(255,255,255,0.06)", color: "#D4A017", fontSize: "18px", fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,160,23,0.15)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>−</button>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: "#fff", minWidth: "22px", textAlign: "center" }}>{qty}</span>
                      <button onClick={(e) => { e.stopPropagation(); addProduct(product); }}
                        style={{ width: "38px", height: "38px", borderRadius: "50%", border: "none",
                          background: "#D4A017", color: "#000", fontSize: "18px", fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit",
                          boxShadow: "0 4px 16px rgba(212,160,23,0.25)" }}>+</button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); addProduct(product); }}
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
        )}

        {activeCat === "promos" && promos.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.2)" }}>
            <p style={{ fontSize: "16px" }}>No hay promos activas por ahora</p>
          </div>
        )}
        {activeCat !== "promos" && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.2)" }}>
            <p style={{ fontSize: "16px" }}>Próximamente</p>
          </div>
        )}
      </div>

      {/* ── FLOATING CART ── */}
      {count > 0 && !cartOpen && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 100 }}>
          <button onClick={() => setCartOpen(true)} className="cart-pulse"
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
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", borderRadius: "20px", background: "rgba(255,255,255,0.03)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "#fff" }}>
                        {item.type === "product" ? item.data.name.trim() : `🔥 ${item.data.name.trim()}`}
                      </p>
                      <p style={{ fontSize: "13px", color: item.type === "promo" ? "#EAB308" : "#D4A017", fontWeight: 600, margin: "3px 0 0" }}>
                        ${((item.type === "product"
                          ? parseFloat(item.data.price || "0")
                          : parseFloat(item.data.customPrice || "0")) * item.quantity).toLocaleString("es-AR")}
                      </p>
                      {item.type === "promo" && item.data.items && item.data.items.length > 0 && (
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
                          Incluye: {item.data.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => remove(item.id)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>−</button>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff", minWidth: "18px", textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => { if (item.type === "product") addProduct(item.data); else addPromo(item.data); }} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: item.type === "promo" ? "#EAB308" : "#D4A017", color: "#000", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>+</button>
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

      {/* ── MODAL DE DETALLE ── */}
      {selectedItem && (
        <div className="modal-backdrop"
          onClick={() => setSelectedItem(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            animation: "fadeIn 0.2s ease",
          }}>
          <div className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "480px",
              height: "100dvh", maxHeight: "100dvh",
              background: "#0a0a0a",
              display: "flex", flexDirection: "column",
              position: "relative",
              animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
            }}>
            {/* Close button */}
            <button onClick={() => setSelectedItem(null)}
              style={{
                position: "absolute", top: "16px", right: "16px", zIndex: 10,
                width: "40px", height: "40px", borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", border: "none",
                color: "#fff", fontSize: "20px", cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(8px)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.5)"}>
              ✕
            </button>

            {/* ── Image section ── */}
            <div style={{
              width: "100%", height: "45dvh", minHeight: "280px",
              overflow: "hidden", position: "relative", flexShrink: 0,
              background: "linear-gradient(135deg, rgba(212,160,23,0.08), rgba(0,0,0,0.3))",
            }}>
              {selectedItem.type === "product" ? (
                (() => {
                  const imgUrl = getImageUrl(selectedItem.data);
                  return imgUrl ? (
                    <img src={imgUrl} alt={selectedItem.data.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                      <span style={{ fontSize: "120px", opacity: 0.2 }}>{emojiMap[selectedItem.data.category] || "📦"}</span>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const promo = selectedItem.data;
                  const imgUrl = promo.imageUrl && (promo.imageUrl.startsWith("http") ? promo.imageUrl : null);
                  return (
                    <>
                      {imgUrl ? (
                        <img src={imgUrl} alt={promo.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                          <span style={{ fontSize: "120px", opacity: 0.2 }}>⭐</span>
                        </div>
                      )}
                      <div style={{
                        position: "absolute", top: "16px", left: "16px",
                        padding: "6px 16px", borderRadius: "100px",
                        background: "linear-gradient(135deg, #EAB308, #CA8A04)",
                        color: "#000", fontSize: "12px", fontWeight: 800,
                        letterSpacing: "0.5px", textTransform: "uppercase",
                      }}>
                        PROMO
                      </div>
                    </>
                  );
                })()
              )}
              {/* Gradient fade at bottom of image */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: "80px",
                background: "linear-gradient(transparent, #0a0a0a)",
              }} />
            </div>

            {/* ── Info section ── */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "24px",
              display: "flex", flexDirection: "column", gap: "20px",
            }}>
              {/* Product: category pill */}
              {selectedItem.type === "product" && (
                <div style={{
                  display: "inline-flex", alignSelf: "flex-start",
                  padding: "4px 14px", borderRadius: "100px",
                  background: "rgba(212,160,23,0.1)",
                  border: "1px solid rgba(212,160,23,0.1)",
                  fontSize: "12px", fontWeight: 600, color: "#D4A017",
                }}>
                  {CATEGORIES.find((c) => c.key === selectedItem.data.category)?.label || selectedItem.data.category}
                </div>
              )}

              {/* Name */}
              <h2 style={{
                fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 800,
                margin: 0, color: "#fff", lineHeight: 1.2,
              }}>
                {selectedItem.type === "product"
                  ? selectedItem.data.name.trim()
                  : selectedItem.data.name.trim()}
              </h2>

              {/* Description */}
              {(selectedItem.type === "product" && selectedItem.data.description) && (
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>
                  {selectedItem.data.description.trim()}
                </p>
              )}
              {(selectedItem.type === "promo" && selectedItem.data.description) && (
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>
                  {selectedItem.data.description.trim()}
                </p>
              )}

              {/* Promo: items included */}
              {selectedItem.type === "promo" && selectedItem.data.items && selectedItem.data.items.length > 0 && (
                <div style={{
                  padding: "16px 18px", borderRadius: "16px",
                  background: "rgba(250,204,21,0.04)",
                  border: "1px solid rgba(250,204,21,0.08)",
                }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(250,204,21,0.5)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Incluye:
                  </p>
                  {selectedItem.data.items.map((item, i) => (
                    <p key={i} style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", margin: "4px 0" }}>
                      {item.quantity}x {item.productName}
                    </p>
                  ))}
                </div>
              )}

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* ── Price + Action ── */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{
                  fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 800,
                  background: selectedItem.type === "promo"
                    ? "linear-gradient(135deg, #EAB308, #F5A623)"
                    : "linear-gradient(135deg, #D4A017, #F5A623)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  {selectedItem.type === "product"
                    ? `$${parseFloat(selectedItem.data.price || "0").toLocaleString("es-AR")}`
                    : selectedItem.data.customPrice
                      ? `$${parseFloat(selectedItem.data.customPrice).toLocaleString("es-AR")}`
                      : "Consultar"}
                </span>

                {(() => {
                  if (selectedItem.type === "product") {
                    const p = selectedItem.data;
                    const inCart = cart.find((i): i is CartItem & { type: "product" } => i.type === "product" && i.data.id === p.id);
                    const qty = inCart?.quantity || 0;
                    return qty > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button onClick={(e) => { e.stopPropagation(); remove("product-" + p.id); }}
                          style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none",
                            background: "rgba(255,255,255,0.08)", color: "#D4A017", fontSize: "20px", fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit" }}>−</button>
                        <span style={{ fontSize: "18px", fontWeight: 600, color: "#fff", minWidth: "24px", textAlign: "center" }}>{qty}</span>
                        <button onClick={(e) => { e.stopPropagation(); addProduct(p); }}
                          style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none",
                            background: "#D4A017", color: "#000", fontSize: "20px", fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                            boxShadow: "0 4px 20px rgba(212,160,23,0.3)" }}>+</button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); addProduct(p); }}
                        style={{ padding: "14px 28px", borderRadius: "100px", border: "none",
                          background: "linear-gradient(135deg, #D4A017, #F5A623)",
                          color: "#000", fontSize: "15px", fontWeight: 700, cursor: "pointer",
                          fontFamily: "inherit",
                          boxShadow: "0 4px 20px rgba(212,160,23,0.25)" }}>
                        + Agregar
                      </button>
                    );
                  } else {
                    const promo = selectedItem.data;
                    const inCart = cart.find((i): i is CartItem & { type: "promo" } => i.type === "promo" && i.data.id === promo.id);
                    const qty = inCart?.quantity || 0;
                    return qty > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button onClick={(e) => { e.stopPropagation(); remove("promo-" + promo.id); }}
                          style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none",
                            background: "rgba(255,255,255,0.08)", color: "#EAB308", fontSize: "20px", fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit" }}>−</button>
                        <span style={{ fontSize: "18px", fontWeight: 600, color: "#fff", minWidth: "24px", textAlign: "center" }}>{qty}</span>
                        <button onClick={(e) => { e.stopPropagation(); addPromo(promo); }}
                          style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none",
                            background: "#EAB308", color: "#000", fontSize: "20px", fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                            boxShadow: "0 4px 20px rgba(234,179,8,0.3)" }}>+</button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); addPromo(promo); }}
                        style={{ padding: "14px 28px", borderRadius: "100px", border: "none",
                          background: "linear-gradient(135deg, #EAB308, #CA8A04)",
                          color: "#000", fontSize: "15px", fontWeight: 700, cursor: "pointer",
                          fontFamily: "inherit",
                          boxShadow: "0 4px 20px rgba(234,179,8,0.25)" }}>
                        + Agregar
                      </button>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ANIMATIONS Y RESPONSIVE ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(60px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 8px 40px rgba(212,160,23,0.35); }
          50% { box-shadow: 0 12px 60px rgba(212,160,23,0.5); }
        }
        .cart-pulse {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        ::-webkit-scrollbar { display: none; }
        
        @media (max-width: 480px) {
          .product-card {
            min-width: 82vw !important;
            max-width: 85vw !important;
            padding: 18px !important;
            border-radius: 22px !important;
          }
          .product-image {
            height: 140px !important;
            border-radius: 16px !important;
          }
          .product-name {
            font-size: 16px !important;
          }
          .product-price {
            font-size: 22px !important;
          }
          .cat-tab {
            padding: 8px 14px !important;
            font-size: 12px !important;
          }
          .header-padding {
            padding: 40px 16px 24px !important;
          }
          .bg-emoji {
            font-size: 200px !important;
          }
        }
      `}</style>
    </div>
  );
}
