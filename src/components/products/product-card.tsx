import type { Product } from "@/lib/constants";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(212,160,23,0.3)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Coming soon badge */}
      {product.comingSoon && (
        <div className="absolute top-3 right-3 z-10">
          <span
            className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
            style={{
              background: "rgba(212,160,23,0.15)",
              border: "1px solid rgba(212,160,23,0.4)",
              color: "#D4A017",
            }}
          >
            Próximamente
          </span>
        </div>
      )}

      {/* Image placeholder */}
      <div
        className="w-full h-44 flex items-center justify-center text-6xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(232,113,42,0.1) 100%)",
        }}
      >
        <span role="img" aria-label={product.name}>
          {product.emoji}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-5 flex-1">
        {/* Name */}
        <h3
          className="text-lg font-bold"
          style={{
            background:
              "linear-gradient(135deg, #D4A017, #F5A623)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {product.name}
        </h3>

        {/* Ingredients */}
        <p className="text-sm text-white/60 leading-relaxed flex-1">
          {product.ingredients}
        </p>

        {/* Price */}
        {product.price !== null ? (
          <p
            className="text-2xl font-black mt-2"
            style={{
              background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ${product.price.toLocaleString("es-AR")}
          </p>
        ) : (
          <p className="text-sm font-semibold text-white/40 mt-2 uppercase tracking-wider">
            Precio a consultar
          </p>
        )}
      </div>
    </div>
  );
}
