"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdminSidebarContent from "./sidebar-content";

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "A";
}

export default function AdminTopbar({ user }: TopbarProps) {
  const initials = getInitials(user.name, user.email);
  const displayName = user.name ?? user.email ?? "Admin";

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4 gap-3">
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="md:hidden" />
          }
        >
          <MenuIcon className="size-5" />
          <span className="sr-only">Abrir menú</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* User info */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-foreground leading-none">
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground">Administrador</span>
        </div>
        <Avatar>
          <AvatarFallback className="bg-primary/20 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Cerrar sesión"
        >
          <LogOutIcon className="size-4" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}
