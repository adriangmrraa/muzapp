import Link from "next/link";

export function HeroSection() {
  return (
    <section
      className="relative flex flex-col items-center justify-center min-h-screen text-center px-4"
      style={{
        background:
          "radial-gradient(ellipse at 60% 40%, rgba(212,160,23,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(232,113,42,0.08) 0%, transparent 50%), #0a0a0a",
      }}
    >
      {/* Decorative golden circle blur */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl">
        {/* Tag line */}
        <span
          className="inline-block text-xs font-semibold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full"
          style={{
            background: "rgba(212,160,23,0.1)",
            border: "1px solid rgba(212,160,23,0.3)",
            color: "#D4A017",
          }}
        >
          Hamburguesas Artesanales Premium
        </span>

        {/* Main title */}
        <h1
          className="text-6xl sm:text-7xl md:text-8xl font-black leading-none tracking-tight"
          style={{
            background:
              "linear-gradient(135deg, #D4A017 0%, #F5A623 50%, #E8712A 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Mrs
          <br />
          Muzzarella
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed font-light">
          Sabores únicos, ingredientes de primera. Cada mordida es una experiencia que no vas a olvidar.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link
            href="/hamburguesas"
            className="btn-gold inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-widest"
          >
            🍔 Ver Hamburguesas
          </Link>
          <Link
            href="/pan-mayorista"
            className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold uppercase tracking-widest rounded-full transition-all duration-300 hover:scale-105"
            style={{
              background: "rgba(212,160,23,0.1)",
              border: "1px solid rgba(212,160,23,0.4)",
              color: "#D4A017",
            }}
          >
            Pan Mayorista
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs tracking-widest uppercase text-white/60">
            Scroll
          </span>
          <div
            className="w-px h-8 rounded-full"
            style={{
              background:
                "linear-gradient(to bottom, rgba(212,160,23,0.6), transparent)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
