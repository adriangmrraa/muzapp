"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
  motion,
} from "framer-motion";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/hamburguesas", label: "Hamburguesas" },
  { href: "/carta-digital", label: "Carta Digital" },
  { href: "/tragos-vip", label: "Tragos VIP" },
  { href: "/pan-mayorista", label: "Pan Mayorista" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const prevY = useRef(0);
  const prefersReduced = useReducedMotion();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const bgColor = useTransform(
    scrollY,
    [0, 300],
    ["rgba(0,0,0,0.7)", "rgba(0,0,0,0.95)"]
  );

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = prevY.current;
    prevY.current = latest;
    if (latest > prev && latest > 140) setHidden(true);
    else if (latest < prev) setHidden(false);
  });

  return (
    <><motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={false}
      animate={prefersReduced ? {} : { y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        background: bgColor,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/images/logo.png"
              alt="Mrs Muzzarella"
              width={36}
              height={36}
              className="object-contain"
            />
            <span
              className="text-xl font-black tracking-tight hidden sm:inline"
              style={{
                background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Mrs Muzzarella
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200"
                style={{
                  color: pathname === link.href ? "#f8d582" : "rgba(255,255,255,0.7)",
                  background: pathname === link.href ? "rgba(212,160,23,0.12)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Cart button */}
            <Link href="/carta-digital" className="hidden lg:inline-flex rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[#151006] transition-transform hover:scale-[1.03]" style={{ background: "#D4A017" }}>
              Pedir ahora
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-white/80 hover:text-amber-400 transition-colors bg-transparent border-none cursor-pointer"
              aria-label="Abrir carrito"
            >
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence mode="popLayout">
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={prefersReduced ? {} : { scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full"
                    style={{ background: "#D4A017", color: "#0a0a0a" }}
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className="p-2 text-white/80 hover:text-amber-400 transition-colors bg-transparent border-none cursor-pointer"
                aria-label="Abrir menú"
              >
                {open ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                )}
              </SheetTrigger>
              <SheetContent side="right" className="w-72 border-l"
                style={{ background: "#0a0a0a", borderColor: "rgba(212,160,23,0.3)" }}
              >
                <div className="pt-8 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <Image src="/assets/images/logo.png" alt="Mrs Muzzarella" width={28} height={28} className="object-contain" />
                    <span className="text-lg font-black"
                      style={{
                        background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      Mrs Muzzarella
                    </span>
                  </div>
                  <nav className="flex flex-col gap-4">
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3 py-2 text-base font-semibold transition-colors"
                        style={{
                          color: pathname === link.href ? "#f8d582" : "rgba(255,255,255,0.78)",
                          background: pathname === link.href ? "rgba(212,160,23,0.12)" : "transparent",
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>);
}
