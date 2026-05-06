"use client";

import { useActionState } from "react";
import { signInAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, LoaderIcon } from "lucide-react";

const initialState = { error: "" };

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="admin@mrsmuzzarella.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircleIcon className="size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="btn-gold mt-2 h-10 w-full rounded-xl">
        {isPending ? (
          <span className="flex items-center gap-2">
            <LoaderIcon className="size-4 animate-spin" />
            Ingresando…
          </span>
        ) : (
          "Ingresar"
        )}
      </Button>
    </form>
  );
}
