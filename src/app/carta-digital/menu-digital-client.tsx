"use client";

import { useState, useMemo } from "react";

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
  { key: "hamburguesa", label: "🍔 Hamburguesas" },
  { key: "acompanamiento", label: "🍟 Acompañamientos" },
  { key: "bebidas", label: "🥤 Bebidas" },
  { key: "pan_mayorista", label: "🍞 Pan Mayorista" },
  { key: "tragos_vip", label: "🍹 Tragos V.I.P" },
];

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "'Space Grotesk', sans-serif",
    paddingBottom: "100px",
  },
  header: {
    background: "linear-gradient(180deg, #0f0800 0%, #0a0a0a 100%)",
    borderBottom: "1px solid rgba(212,160,23,0.12)",
    padding: "48px 20px 24px",
    textAlign: "center" as const,
    position: "relative" as const,
    overflow: "hidden",
  },
  headerGlow: {
    position: "absolute" as const,
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(212,160,23,0.10), transparent 70%)",
    top: "-120px",
    right: "-80px",
    pointerEvents: "none" as const,
  },
  headerGlow2: {
    position: "absolute" as const,
    width: "250px",
    height: "250px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(232,113,42,0.06), transparent 70%)",
    bottom: "-60px",
    left: "-60px",
    pointerEvents: "none" as const,
  },
  title: {
    fontSize: "clamp(26px, 5vw, 36px)",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.4)",
    marginTop: "6px",
    fontWeight: 400,
  },
  tabsContainer: {
    display: "flex",
    gap: "6px",
    padding: "14px 16px 10px",
    overflowX: "auto" as const,
    scrollbarWidth: "none" as const,
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
    background: "#0a0a0a",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  tab: (active: boolean) => ({
    padding: "10px 18px",
    borderRadius: "22px",
    border: active ? "1px solid rgba(212,160,23,0.5)" : "1px solid rgba(255,255,255,0.06)",
    background: active ? "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.05))" : "rgba(255,255,255,0.03)",
    color: active ? "#D4A017" : "rgba(255,255,255,0.5)",
    fontSize: "13px",
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "all 0.25s ease",
    fontFamily: "inherit",
    boxShadow: active ? "0 0 20px rgba(212,160,23,0.10)" : "none",
  }),
  scrollArea: {
    display: "flex",
    gap: "18px",
    padding: "20px 16px",
    overflowX: "auto" as const,
    scrollSnapType: "x mandatory" as const,
    scrollbarWidth: "none" as const,
  },
  card: {
    minWidth: "290px",
    maxWidth: "310px",
    background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(212,160,23,0.10)",
    borderRadius: "20px",
    padding: "24px 20px 20px",
    scrollSnapAlign: "start" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
    flexShrink: 0,
    transition: "all 0.3s ease",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  imageContainer: {
    width: "100%",
    height: "170px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, rgba(212,160,23,0.06), rgba(232,113,42,0.03))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden" as const,
    position: "relative" as const,
    border: "1px solid rgba(212,160,23,0.06)",
  },
  productName: {
    fontSize: "18px",
    fontWeight: 700,
    margin: 0,
    color: "#fff",
    letterSpacing: "-0.3px",
  },
  priceText: {
    fontSize: "24px",
    fontWeight: 800,
    background: "linear-gradient(135deg, #D4A017, #F5A623)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text" as const,
  },
  addBtn: {
    padding: "10px 22px",
    borderRadius: "12px",
    border: "1px solid rgba(212,160,23,0.2)",
    background: "linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.08))",
    color: "#D4A017",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
  },
  qtyBtn: (isAdd: boolean) => ({
    width: "34px", height: "34px", borderRadius: "50%",
    border: isAdd ? "none" : "1px solid rgba(212,160,23,0.25)",
    background: isAdd ? "#D4A017" : "rgba(212,160,23,0.08)",
    color: isAdd ? "#000" : "#D4A017",
    fontSize: "16px", fontWeight: 700,
    cursor: "pointer", display: "flex" as const, alignItems: "center" as const,
    justifyContent: "center" as const, fontFamily: "inherit",
    transition: "all 0.2s ease",
  }),
  cartBtn: {
    padding: "16px 32px", borderRadius: "16px", border: "none",
    background: "linear-gradient(135deg, #D4A017, #F5A623)",
    color: "#000",
    fontSize: "15px", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 4px 30px rgba(212,160,23,0.35)",
    display: "flex", alignItems: "center" as const, gap: "10px",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
  },
  drawerOverlay: {
    position: "fixed" as const, inset: 0, zIndex: 200,
    display: "flex", flexDirection: "column" as const,
    background: "#0a0a0a",
  },
  drawerHeader: {
    display: "flex", alignItems: "center" as const, justifyContent: "space-between" as const,
    padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.06)", border: "none",
    color: "#fff", width: "36px", height: "36px", borderRadius: "50%",
    fontSize: "16px", cursor: "pointer", fontFamily: "inherit",
    transition: "all 0.2s ease",
  },
  cartItem: {
    display: "flex", alignItems: "center" as const, gap: "12px",
    padding: "14px 18px", borderRadius: "14px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  sendBtn: (disabled: boolean) => ({
    width: "100%", padding: "16px", borderRadius: "16px", border: "none",
    background: disabled ? "rgba(212,160,23,0.2)" : "linear-gradient(135deg, #D4A017, #F5A623)",
    color: disabled ? "rgba(255,255,255,0.3)" : "#000",
    fontSize: "16px", fontWeight: 700, cursor: disabled ? "default" : "pointer",
    fontFamily: "inherit", transition: "all 0.2s ease",
  }),
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerGlow} />
        <div style={styles.headerGlow2} />
        <h1 style={styles.title}>
          <span style={{ color: "#D4A017" }}>Mrs</span>{" "}
          <span style={{ color: "#fff" }}>Muzzarella</span>
        </h1>
        <p style={styles.subtitle}>Deslizá, elegí y pedí por WhatsApp</p>
        <a href="/"
          style={{
            display: "inline-block", marginTop: "12px",
            fontSize: "12px", color: "rgba(212,160,23,0.6)",
            textDecoration: "none", borderBottom: "1px solid rgba(212,160,23,0.2)",
            paddingBottom: "2px", fontFamily: "inherit",
          }}
        >← Volver al inicio</a>
      </div>

      {/* Categories */}
      <div style={styles.tabsContainer}>
        {categories.map((cat) => (
          <button key={cat.key} onClick={() => setActiveCat(cat.key)} style={styles.tab(activeCat === cat.key)}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products */}
      <div style={styles.scrollArea}>
        {filtered.map((product) => {
          const imgUrl = getImageUrl(product);
          const inCart = cart.find((i) => i.product.id === product.id);
          const qty = inCart?.quantity || 0;
          const emojiMap: Record<string, string> = {
            hamburguesa: "🍔", acompanamiento: "🍟", bebidas: "🥤",
            pan_mayorista: "🍞", tragos_vip: "🍹",
          };
          return (
            <div key={product.id} style={styles.card}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(212,160,23,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(212,160,23,0.10)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              {/* Image */}
              <div style={styles.imageContainer}>
                {imgUrl ? (
                  <img src={imgUrl} alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.transform = "scale(1)"}
                    onError={(e) => { const el = e.currentTarget; el.style.display = "none"; const parent = el.parentElement; if (parent) parent.innerHTML = `<span style="font-size:64px;opacity:0.3;">${emojiMap[product.category] || "📦"}</span>`; }}
                  />
                ) : (
                  <span style={{ fontSize: "64px", opacity: 0.25 }}>{emojiMap[product.category] || "📦"}</span>
                )}
              </div>

              {/* Name + Desc */}
              <div style={{ flex: 1 }}>
                <h3 style={styles.productName}>{product.name.trim()}</h3>
                {product.description && (
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: "6px 0 0", lineHeight: 1.4 }}>
                    {product.description.trim()}
                  </p>
                )}
              </div>

              {/* Price + Actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                <span style={styles.priceText}>${parseFloat(product.price || "0").toLocaleString("es-AR")}</span>
                {qty > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button onClick={() => remove(product.id)} style={styles.qtyBtn(false)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,160,23,0.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(212,160,23,0.08)"; }}>−</button>
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#fff", minWidth: "22px", textAlign: "center" }}>{qty}</span>
                    <button onClick={() => add(product)} style={styles.qtyBtn(true)}>+</button>
                  </div>
                ) : (
                  <button onClick={() => add(product)} style={styles.addBtn}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,160,23,0.3), rgba(212,160,23,0.15))"; e.currentTarget.style.borderColor = "rgba(212,160,23,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.08))"; e.currentTarget.style.borderColor = "rgba(212,160,23,0.2)"; }}>
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

      {/* Floating Cart */}
      {count > 0 && !cartOpen && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 100 }}>
          <button onClick={() => setCartOpen(true)} style={styles.cartBtn}>
            🛒 {count} {count === 1 ? "item" : "items"}
            <span style={{ opacity: 0.8, fontWeight: 600 }}>${total.toLocaleString("es-AR")}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={styles.drawerOverlay}>
          <div style={styles.drawerHeader}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#fff" }}>🛒 Tu pedido</h2>
            <button onClick={() => setCartOpen(false)} style={styles.closeBtn}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {!cart.length ? (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", padding: "40px", fontSize: "14px" }}>
                No agregaste productos todavía
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {cart.map((item) => (
                  <div key={item.product.id} style={styles.cartItem}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "#fff" }}>{item.product.name.trim()}</p>
                      <p style={{ fontSize: "13px", color: "#D4A017", fontWeight: 600, margin: "3px 0 0" }}>
                        ${(parseFloat(item.product.price || "0") * item.quantity).toLocaleString("es-AR")}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => remove(item.product.id)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>−</button>
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
            <button onClick={send} disabled={!cart.length} style={styles.sendBtn(!cart.length)}
              onMouseEnter={(e) => { if (cart.length) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 30px rgba(212,160,23,0.4)"; }}}
              onMouseLeave={(e) => { if (cart.length) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}}>
              {orderSent ? "✅ Pedido enviado!" : "📤 Enviar pedido por WhatsApp"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
