import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="border-t py-12 mt-auto"
      style={{ background: "#050505", borderColor: "rgba(212,160,23,0.2)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <span
              className="text-xl font-black"
              style={{
                background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Mrs Muzzarella
            </span>
            <p className="text-sm text-white/50 leading-relaxed">
              Hamburguesas artesanales premium y pan mayorista de calidad. Hechos con amor y los mejores ingredientes.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              Navegación
            </h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-white/60 hover:text-amber-400 transition-colors">
                Inicio
              </Link>
              <Link href="/hamburguesas" className="text-sm text-white/60 hover:text-amber-400 transition-colors">
                Hamburguesas
              </Link>
              <Link href="/pan-mayorista" className="text-sm text-white/60 hover:text-amber-400 transition-colors">
                Pan Mayorista
              </Link>
            </nav>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              Seguinos
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href="#"
                className="text-sm text-white/60 hover:text-amber-400 transition-colors"
              >
                Instagram
              </a>
              <a
                href="#"
                className="text-sm text-white/60 hover:text-amber-400 transition-colors"
              >
                Facebook
              </a>
              <a
                href="#"
                className="text-sm text-white/60 hover:text-amber-400 transition-colors"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 border-t"
          style={{ borderColor: "rgba(212,160,23,0.15)" }}
        >
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Mrs Muzzarella. Todos los derechos reservados.
          </p>
          <p className="text-xs text-white/40">
            Hecho con amor en Argentina 🇦🇷
          </p>
        </div>
      </div>
    </footer>
  );
}
