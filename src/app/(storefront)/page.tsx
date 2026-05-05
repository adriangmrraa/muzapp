import { HeroSection } from "@/components/hero/hero-section";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <HeroSection />

      {/* About section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl p-8 sm:p-12"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(212,160,23,0.3)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {/* Text */}
              <div className="flex flex-col gap-5">
                <span
                  className="text-xs font-semibold uppercase tracking-[0.3em]"
                  style={{ color: "#D4A017" }}
                >
                  Sobre Nosotros
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Más que una{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    hamburguesa
                  </span>
                </h2>
                <p className="text-white/65 leading-relaxed">
                  En Mrs Muzzarella creemos que cada ingrediente importa. Trabajamos con productores locales, elaboramos nuestro propio pan y preparamos cada hamburgesa al momento. Sin compromiso. Sin atajos.
                </p>
                <p className="text-white/65 leading-relaxed">
                  También proveemos pan artesanal a restaurantes y cocinas que, como nosotros, no se conforman con lo mediocre.
                </p>
                <div className="flex gap-4 mt-2">
                  <Link
                    href="/hamburguesas"
                    className="btn-gold inline-flex items-center justify-center px-6 py-3 text-sm font-bold uppercase tracking-widest"
                  >
                    Ver Menú
                  </Link>
                  <Link
                    href="/pan-mayorista"
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold uppercase tracking-widest rounded-full transition-all duration-300 hover:scale-105"
                    style={{
                      background: "rgba(212,160,23,0.08)",
                      border: "1px solid rgba(212,160,23,0.3)",
                      color: "#D4A017",
                    }}
                  >
                    Pan Mayorista
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "100%", label: "Ingredientes frescos" },
                  { value: "6+", label: "Variedades de hamburguesa" },
                  { value: "Pan", label: "Artesanal propio" },
                  { value: "♥", label: "Hecho con amor" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl text-center"
                    style={{
                      background: "rgba(212,160,23,0.07)",
                      border: "1px solid rgba(212,160,23,0.2)",
                    }}
                  >
                    <span
                      className="text-3xl font-black"
                      style={{
                        background:
                          "linear-gradient(135deg, #D4A017, #F5A623)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {stat.value}
                    </span>
                    <span className="text-xs text-white/50 font-medium">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
