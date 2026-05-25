"use client";

import { useState, useMemo, useRef } from "react";

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
  { key: "hamburguesa", label: "🍔 Hamburguesas", emoji: "🍔" },
  { key: "acompanamiento", label: "🍟 Acompañamientos", emoji: "🍟" },
  { key: "bebidas", label: "🥤 Bebidas", emoji: "🥤" },
  { key: "pan_mayorista", label: "🍞 Pan Mayorista", emoji: "🍞" },
  { key: "tragos_vip", label: "🍹 Tragos V.I.P", emoji: "🍹" },
];

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
  const [activeCategory, setActiveCategory] = useState("hamburguesa");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => CATEGORIES.filter((c) => products.some((p) => p.category === c.key)),
    [products]
  );

  const filteredProducts = useMemo(
    () => products.filter((p) => p.category === activeCategory),
    [products, activeCategory]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + (parseFloat(item.product.price || "0") * item.quantity), 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const sendWhatsApp = () => {
    if (cart.length === 0) return;
    const lines = cart.map(
      (item) =>
        `• ${item.quantity}x ${item.product.name} — $${(
          parseFloat(item.product.price || "0") * item.quantity
        ).toLocaleString("es-AR")}`
    );
    const message = [
      "🛵 *Nuevo Pedido - Carta Digital*",
      "",
      ...lines,
      "",
      `💰 *Total: $${cartTotal.toLocaleString("es-AR")}*`,
    ].join("\n");

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappPhone}?text=${encoded}`, "_blank");
    setOrderSent(true);
    setTimeout(() => setOrderSent(false), 3000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif",
        paddingBottom: "120px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 100%)",
          borderBottom: "1px solid rgba(212, 160, 23, 0.15)",
          padding: "40px 20px 24px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Glow orbs */}
        <div style={{
          position: "absolute", width: "300px", height: "300px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,23,0.08), transparent 70%)",
          top: "-80px", right: "-80px", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: "200px", height: "200px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,23,0.06), transparent 70%)",
          bottom: "-40px", left: "-40px", pointerEvents: "none",
        }} />

        <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          <span style={{ color: "#D4A017" }}>Mrs</span>{" "}
          <span style={{ color: "#fff" }}>Muzzarella</span>
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
          Carta digital — armá tu pedido y pedilo por WhatsApp
        </p>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          padding: "16px 16px 12px",
          overflowX: "auto",
          scrollbarWidth: "none",
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#0a0a0a",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: activeCategory === cat.key
                ? "1px solid rgba(212, 160, 23, 0.4)"
                : "1px solid rgba(255,255,255,0.08)",
              background: activeCategory === cat.key
                ? "rgba(212, 160, 23, 0.12)"
                : "rgba(255,255,255,0.04)",
              color: activeCategory === cat.key ? "#D4A017" : "rgba(255,255,255,0.6)",
              fontSize: "13px",
              fontWeight: activeCategory === cat.key ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            {cat.emoji} {cat.label.replace(/^[^\s]+\s/, "")}
          </button>
        ))}
      </div>

      {/* Product Grid / Carousel */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: "16px",
          padding: "20px 16px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
        }}
      >
        {filteredProducts.map((product) => {
          const imgUrl = getImageUrl(product);
          const inCart = cart.find((item) => item.product.id === product.id);
          const qty = inCart?.quantity || 0;
          return (
            <div
              key={product.id}
              style={{
                minWidth: "280px",
                maxWidth: "300px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "20px",
                scrollSnapAlign: "start",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                flexShrink: 0,
              }}
            >
              {/* Image */}
              <div
                style={{
                  width: "100%",
                  height: "160px",
                  borderRadius: "12px",
                  background: "rgba(212,160,23,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        `<span style="font-size:64px;opacity:0.3;">🍔</span>`;
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "64px", opacity: 0.3 }}>
                    {product.category === "hamburguesa" ? "🍔" :
                     product.category === "acompanamiento" ? "🍟" :
                     product.category === "bebidas" ? "🥤" :
                     product.category === "pan_mayorista" ? "🍞" :
                     product.category === "tragos_vip" ? "🍹" : "📦"}
                  </span>
                )}
              </div>

              {/* Name & Description */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#fff" }}>
                  {product.name.trim()}
                </h3>
                {product.description && (
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: "4px 0 0", lineHeight: 1.4 }}>
                    {product.description.trim()}
                  </p>
                )}
              </div>

              {/* Price & Add Button */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#D4A017" }}>
                  ${parseFloat(product.price || "0").toLocaleString("es-AR")}
                </span>
                {qty > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        border: "1px solid rgba(212,160,23,0.3)",
                        background: "rgba(212,160,23,0.1)",
                        color: "#D4A017", fontSize: "16px", fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", fontFamily: "inherit",
                      }}
                    >−</button>
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#fff", minWidth: "20px", textAlign: "center" }}>
                      {qty}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        border: "none",
                        background: "#D4A017",
                        color: "#000", fontSize: "16px", fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", fontFamily: "inherit",
                      }}
                    >+</button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    style={{
                      padding: "8px 20px", borderRadius: "10px", border: "none",
                      background: "rgba(212,160,23,0.15)",
                      color: "#D4A017", fontSize: "13px", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                  >
                    + Agregar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.3)" }}>
          <p style={{ fontSize: "16px" }}>No hay productos en esta categoría</p>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div style={{
          position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
          zIndex: 100, display: "flex", gap: "10px",
        }}>
          <button
            onClick={() => setCartOpen(true)}
            style={{
              padding: "14px 28px", borderRadius: "14px", border: "none",
              background: "#D4A017", color: "#000",
              fontSize: "15px", fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 30px rgba(212,160,23,0.3)",
              display: "flex", alignItems: "center", gap: "10px",
              fontFamily: "inherit",
            }}
          >
            🛒 Ver pedido ({cartCount})
            <span style={{ opacity: 0.8, fontWeight: 600 }}>
              ${cartTotal.toLocaleString("es-AR")}
            </span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", flexDirection: "column",
          background: "#0a0a0a",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
              🛒 Tu pedido
            </h2>
            <button onClick={() => setCartOpen(false)}
              style={{
                background: "rgba(255,255,255,0.08)", border: "none",
                color: "#fff", width: "36px", height: "36px", borderRadius: "50%",
                fontSize: "18px", cursor: "pointer", fontFamily: "inherit",
              }}
            >✕</button>
          </div>

          {/* Items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {cart.length === 0 ? (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "40px" }}>
                No agregaste productos todavía
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {cart.map((item) => (
                  <div key={item.product.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px 16px", borderRadius: "12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
                        {item.product.name.trim()}
                      </p>
                      <p style={{ fontSize: "13px", color: "#D4A017", fontWeight: 600, margin: "2px 0 0" }}>
                        ${(parseFloat(item.product.price || "0") * item.quantity).toLocaleString("es-AR")}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => removeFromCart(item.product.id)}
                        style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          border: "1px solid rgba(255,255,255,0.15)",
                          background: "transparent", color: "#fff",
                          fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
                        }}
                      >−</button>
                      <span style={{ fontSize: "14px", fontWeight: 600, minWidth: "18px", textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button onClick={() => addToCart(item.product)}
                        style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          border: "none", background: "#D4A017", color: "#000",
                          fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
                        }}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "20px", borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column", gap: "12px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Total</span>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#D4A017" }}>
                ${cartTotal.toLocaleString("es-AR")}
              </span>
            </div>
            <button onClick={sendWhatsApp}
              disabled={cart.length === 0}
              style={{
                width: "100%", padding: "16px", borderRadius: "14px", border: "none",
                background: cart.length === 0 ? "rgba(212,160,23,0.3)" : "#D4A017",
                color: cart.length === 0 ? "rgba(255,255,255,0.3)" : "#000",
                fontSize: "16px", fontWeight: 700, cursor: cart.length === 0 ? "default" : "pointer",
                fontFamily: "inherit", transition: "all 0.2s",
              }}
            >
              {orderSent ? "✅ Pedido enviado!" : "📤 Enviar pedido por WhatsApp"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
