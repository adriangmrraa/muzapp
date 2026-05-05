"use client";

interface ProductToggleProps {
  value: "pollo" | "carne";
  onChange: (value: "pollo" | "carne") => void;
}

export function ProductToggle({ value, onChange }: ProductToggleProps) {
  return (
    <div
      className="inline-flex items-center rounded-full p-1 gap-1"
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(212,160,23,0.3)",
      }}
    >
      <button
        onClick={() => onChange("pollo")}
        className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
        style={
          value === "pollo"
            ? {
                background:
                  "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                color: "#0a0a0a",
                boxShadow: "0 4px 15px rgba(212,160,23,0.4)",
              }
            : { color: "rgba(255,255,255,0.6)" }
        }
      >
        🍗 Línea Pollo
      </button>
      <button
        onClick={() => onChange("carne")}
        className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
        style={
          value === "carne"
            ? {
                background:
                  "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                color: "#0a0a0a",
                boxShadow: "0 4px 15px rgba(212,160,23,0.4)",
              }
            : { color: "rgba(255,255,255,0.6)" }
        }
      >
        🥩 Línea Carne
      </button>
    </div>
  );
}
