"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { staggerContainer, fadeUpSmall } from "@/lib/animation-variants";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-64 flex-col md:flex"
      style={{
        backgroundColor: "#0a0a0a",
        borderRight: "1px solid rgba(212,160,23,0.2)",
      }}
    >
      {/* Brand / Logo */}
      <div
        className="flex h-14 items-center px-6"
        style={{ borderBottom: "1px solid rgba(212,160,23,0.15)" }}
      >
        <motion.span
          className="text-base font-black tracking-tight cursor-default select-none"
          style={{
            background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          whileHover={{
            filter: "brightness(1.3)",
            transition: { duration: 0.25 },
          }}
        >
          Mrs Muzzarella
        </motion.span>
      </div>

      {/* Nav */}
      <motion.nav
        className="flex flex-1 flex-col gap-0.5 p-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <motion.div key={item.href} variants={fadeUpSmall}>
              <Link
                href={item.disabled ? "#" : item.href}
                aria-disabled={item.disabled}
                tabIndex={item.disabled ? -1 : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  item.disabled && "pointer-events-none opacity-40"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: "rgba(212,160,23,0.12)",
                        color: "#F5A623",
                      }
                    : { color: "rgba(255,255,255,0.5)" }
                }
                onMouseEnter={(e) => {
                  if (!isActive && !item.disabled) {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "rgba(212,160,23,0.06)";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "rgba(255,255,255,0.85)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !item.disabled) {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "rgba(255,255,255,0.5)";
                  }
                }}
              >
                {/* Gold left border indicator */}
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all duration-200"
                  style={{
                    width: "3px",
                    height: isActive ? "60%" : "0%",
                    background:
                      "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                    opacity: isActive ? 1 : 0,
                  }}
                />

                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
                {item.disabled && (
                  <span
                    className="ml-auto text-[10px] font-normal"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    pronto
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>

      {/* Footer */}
      <div
        className="p-4"
        style={{ borderTop: "1px solid rgba(212,160,23,0.15)" }}
      >
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          Panel Admin v1.0
        </p>
      </div>
    </aside>
  );
}
