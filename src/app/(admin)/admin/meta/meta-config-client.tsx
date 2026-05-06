"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { fadeUpSmall, staggerContainer } from "@/lib/animation-variants";
import { testMetaConnection, type MetaConnectionStatus } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex h-2.5 w-2.5 rounded-full ${
        active ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-red-500/60"
      }`}
    />
  );
}

export function MetaConfigClient({
  initialStatus,
}: {
  initialStatus: MetaConnectionStatus;
}) {
  const [testState, formAction, isPending] = useActionState(
    testMetaConnection,
    null
  );

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* Estado de conexión */}
      <motion.div variants={fadeUpSmall}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Estado de conexión
            </CardTitle>
            <CardDescription>
              Componentes de Meta Ads y su estado actual
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pixel status */}
              <div className="rounded-lg border p-4 flex items-start gap-3 transition-colors hover:bg-white/[0.02]">
                <StatusDot active={initialStatus.pixelConfigured} />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Meta Pixel</span>
                  <span className="text-xs text-muted-foreground">
                    {initialStatus.pixelConfigured
                      ? `ID: ${initialStatus.pixelId}`
                      : "No configurado — falta NEXT_PUBLIC_META_PIXEL_ID"}
                  </span>
                  <span className="text-[11px] text-muted-foreground/60">
                    Tracking client-side de visitas y conversiones (fbq)
                  </span>
                </div>
              </div>

              {/* Server config status */}
              <div className="rounded-lg border p-4 flex items-start gap-3 transition-colors hover:bg-white/[0.02]">
                <StatusDot active={initialStatus.serverConfigured} />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    Conversion API (server-side)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {initialStatus.serverConfigured
                      ? `App ID: ${initialStatus.appId}`
                      : "No configurado — falta META_APP_ID / META_APP_SECRET"}
                  </span>
                  <span className="text-[11px] text-muted-foreground/60">
                    Reporta conversiones desde el servidor a Meta
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Probar conexión */}
      <motion.div variants={fadeUpSmall}>
        <Card>
          <CardHeader>
            <CardTitle>Probar conexión</CardTitle>
            <CardDescription>
              Verificá que las credenciales de Meta funcionen correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <form action={formAction}>
              <Button
                type="submit"
                disabled={isPending}
                variant="outline"
                className="border-[#D4A017]/40 text-[#D4A017] hover:bg-[#D4A017]/10 hover:text-[#F5A623]"
              >
                {isPending
                  ? "Probando conexión..."
                  : "Probar conexión con Meta"}
              </Button>
            </form>

            {testState && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  testState.success
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {testState.message}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Instrucciones */}
      <motion.div variants={fadeUpSmall}>
        <Card>
          <CardHeader>
            <CardTitle>Configuración en Render</CardTitle>
            <CardDescription>
              Estas variables de entorno deben estar configuradas en el dashboard
              de Render
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <code className="rounded bg-white/[0.06] px-2 py-0.5 text-xs font-mono">
                  NEXT_PUBLIC_META_PIXEL_ID
                </code>
                <span className="text-muted-foreground">
                  ID del Pixel de Meta (lo ves en Events Manager)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded bg-white/[0.06] px-2 py-0.5 text-xs font-mono">
                  META_APP_ID
                </code>
                <span className="text-muted-foreground">
                  ID de la App de Facebook Developers
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded bg-white/[0.06] px-2 py-0.5 text-xs font-mono">
                  META_APP_SECRET
                </code>
                <span className="text-muted-foreground">
                  Secret de la App de Facebook Developers
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-xs text-amber-300/80">
              <strong>Importante:</strong> Los cambios en variables de entorno
              requieren un nuevo deploy en Render para que tomen efecto.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
