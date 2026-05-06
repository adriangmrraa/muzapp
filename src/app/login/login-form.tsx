"use client";

import { useActionState, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signInAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, LoaderIcon } from "lucide-react";
import { staggerContainer, fadeUpSmall } from "@/lib/animation-variants";

const initialState = { error: "" };

const GOLD_FOCUS_SHADOW =
  "0 0 0 2px rgba(212,160,23,0.25), 0 0 12px rgba(212,160,23,0.12)";

interface FocusableInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  name: string;
}

function FocusableInput({ id, name, ...props }: FocusableInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Input
      id={id}
      name={name}
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        boxShadow: focused ? GOLD_FOCUS_SHADOW : undefined,
        borderColor: focused
          ? "rgba(212,160,23,0.6)"
          : "rgba(212,160,23,0.15)",
      }}
    />
  );
}

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <motion.form
      action={formAction}
      className="flex flex-col gap-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Email field */}
      <motion.div className="flex flex-col gap-1.5" variants={fadeUpSmall}>
        <Label htmlFor="email" style={{ color: "rgba(245,245,220,0.7)" }}>
          Email
        </Label>
        <FocusableInput
          id="email"
          name="email"
          type="email"
          placeholder="admin@mrsmuzzarella.com"
          required
          autoComplete="email"
        />
      </motion.div>

      {/* Password field */}
      <motion.div className="flex flex-col gap-1.5" variants={fadeUpSmall}>
        <Label htmlFor="password" style={{ color: "rgba(245,245,220,0.7)" }}>
          Contraseña
        </Label>
        <FocusableInput
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </motion.div>

      {/* Error message — animated with AnimatePresence */}
      <AnimatePresence mode="wait">
        {state?.error && (
          <motion.div
            key="error"
            variants={fadeUpSmall}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            style={{
              background: "rgba(139,0,0,0.15)",
              border: "1px solid rgba(139,0,0,0.4)",
              color: "#ff6b6b",
            }}
          >
            <AlertCircleIcon className="size-4 shrink-0" />
            <span>{state.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <motion.div variants={fadeUpSmall} className="mt-2">
        <motion.div
          whileHover={{ scale: isPending ? 1 : 1.02 }}
          whileTap={{ scale: isPending ? 1 : 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Button
            type="submit"
            disabled={isPending}
            className="btn-gold h-11 w-full rounded-xl font-bold uppercase tracking-widest text-sm"
          >
            {isPending ? (
              <motion.span
                className="flex items-center gap-2"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <LoaderIcon className="size-4 animate-spin" />
                Ingresando…
              </motion.span>
            ) : (
              "Ingresar"
            )}
          </Button>
        </motion.div>
      </motion.div>
    </motion.form>
  );
}
