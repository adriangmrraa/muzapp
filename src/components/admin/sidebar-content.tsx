"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export default function AdminSidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-border px-6">
        <span className="text-base font-black tracking-tight text-gold-gradient">
          Mrs Muzzarella
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              aria-disabled={item.disabled}
              tabIndex={item.disabled ? -1 : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                item.disabled && "pointer-events-none opacity-40"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
              {item.disabled && (
                <span className="ml-auto text-[10px] font-normal text-muted-foreground/60">
                  pronto
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
