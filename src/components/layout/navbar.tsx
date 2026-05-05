"use client";

import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/hamburguesas", label: "Hamburguesas" },
  { href: "/pan-mayorista", label: "Pan Mayorista" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(212,160,23,0.25)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className="text-xl font-black tracking-tight"
              style={{
                background:
                  "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Mrs Muzzarella
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/80 hover:text-amber-400 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile sheet */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className="p-2 text-white/80 hover:text-amber-400 transition-colors bg-transparent border-none cursor-pointer"
                aria-label="Abrir menú"
              >
                {open ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                )}
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 border-l"
                style={{
                  background: "#0a0a0a",
                  borderColor: "rgba(212,160,23,0.3)",
                }}
              >
                <div className="pt-8 flex flex-col gap-6">
                  <span
                    className="text-lg font-black"
                    style={{
                      background:
                        "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Mrs Muzzarella
                  </span>
                  <nav className="flex flex-col gap-4">
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="text-base font-medium text-white/80 hover:text-amber-400 transition-colors py-1 border-b"
                        style={{ borderColor: "rgba(212,160,23,0.15)" }}
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
    </header>
  );
}
