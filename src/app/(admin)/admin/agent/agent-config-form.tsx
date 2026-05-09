"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fadeUpSmall, staggerContainer } from "@/lib/animation-variants";
import {
  saveAgentConfig,
  testAgentConnection,
  type AgentConfigState,
  type PhoneIdEntry,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  Plus,
  X,
  ExternalLink,
  Play,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { clsx } from "clsx";

export type { PhoneIdEntry } from "./actions";

export type BusinessHour = {
  day: string;
  open: boolean;
  openTime: string;
  closeTime: string;
};

export type AgentConfigFormData = {
  systemPrompt: string;
  phoneNumber: string;
  enabled: boolean;
  businessHours: BusinessHour[];
  // ─── Nuevos campos ────────────────────────────────────────────────────────
  ycloudApiKey: string;
  whatsappBotNumber: string;
  allowedPhoneIds: PhoneIdEntry[];
  autoReply24h: boolean;
  autoReply24hMessage: string;
  trainBotContext: string;
  // ─── WhatsApp Agent Editor ──────────────────────────────────────────────
  whatsappSystemPrompt: string;
  whatsappInstrucciones: string;
  whatsappPromociones: string;
  whatsappZonasDelivery: { zona: string; disponible: boolean; tiempo: string; costo: number }[];
};

const initialState: AgentConfigState = {
  success: false,
  message: "",
};

const DEFAULT_DAYS: BusinessHour[] = [
  { day: "Lunes", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Martes", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Miércoles", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Jueves", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Viernes", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Sábado", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Domingo", open: false, openTime: "09:00", closeTime: "22:00" },
];

export default function AgentConfigForm({
  config,
}: {
  config: AgentConfigFormData;
}) {
  const [state, formAction, isPending] = useActionState(
    saveAgentConfig,
    initialState
  );

  const [testState, setTestState] = useState<{
    loading: boolean;
    result: null | { success: boolean; message: string };
  }>({ loading: false, result: null });

  // ─── State ──────────────────────────────────────────────────────────────────

  const [enabled, setEnabled] = useState(config.enabled);
  const [showApiKey, setShowApiKey] = useState(false);
  const [allowedPhoneIds, setAllowedPhoneIds] = useState<PhoneIdEntry[]>(
    config.allowedPhoneIds
  );
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [autoReply24h, setAutoReply24h] = useState(config.autoReply24h);
  const [showPreview, setShowPreview] = useState(false);
  const [trainBotContext, setTrainBotContext] = useState(config.trainBotContext);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt);
  const [whatsappSystemPrompt, setWhatsappSystemPrompt] = useState(config.whatsappSystemPrompt || "");
  const [whatsappInstrucciones, setWhatsappInstrucciones] = useState(config.whatsappInstrucciones || "");
  const [whatsappPromociones, setWhatsappPromociones] = useState(config.whatsappPromociones || "");
  const [zonasDelivery, setZonasDelivery] = useState(config.whatsappZonasDelivery || [
    { zona: "centro", disponible: true, tiempo: "20-30 min", costo: 0 },
    { zona: "norte", disponible: true, tiempo: "25-35 min", costo: 0 },
    { zona: "sur", disponible: true, tiempo: "30-40 min", costo: 0 },
  ]);
  const [newZona, setNewZona] = useState({ zona: "", tiempo: "", costo: 0 });

  // ─── Toast notifications ────────────────────────────────────────────────────

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const addPhoneId = () => {
    const name = newName.trim();
    const phone = newPhone.trim();
    if (!name || !phone) {
      toast.error("Completá nombre y teléfono");
      return;
    }
    if (allowedPhoneIds.some((e) => e.phone === phone)) {
      toast.error("Ese teléfono ya está agregado");
      return;
    }
    setAllowedPhoneIds((prev) => [...prev, { name, phone }]);
    setNewName("");
    setNewPhone("");
  };

  const removePhoneId = (phone: string) => {
    setAllowedPhoneIds((prev) => prev.filter((e) => e.phone !== phone));
  };

  const handleTestConfig = async () => {
    setTestState({ loading: true, result: null });
    try {
      const result = await testAgentConnection();
      setTestState({ loading: false, result });
      if (result.success) {
        toast.success("✅ Todas las verificaciones pasaron");
      } else {
        toast.error("Revisá la configuración — hay campos pendientes");
      }
    } catch {
      setTestState({ loading: false, result: { success: false, message: "Error al ejecutar test" } });
      toast.error("Error al ejecutar test");
    }
  };

  const businessHours =
    config.businessHours.length > 0 ? config.businessHours : DEFAULT_DAYS;

  const combinedSystemPrompt = systemPrompt
    ? systemPrompt +
      (trainBotContext
        ? `\n\n--- Contexto adicional ---\n${trainBotContext}`
        : "")
    : "(sin prompt del sistema)";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >
        {/* ═════════════════════════════════════════════════════════════════════
           1. Estado del agente
           ═════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUpSmall}>
          <Card
            className={
              enabled
                ? "border-[#D4A017]/40 transition-colors"
                : "transition-colors"
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Estado del agente
                {enabled && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#D4A017] shadow-[0_0_6px_#D4A017]" />
                )}
              </CardTitle>
              <CardDescription>
                Activá o desactivá el agente de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <input type="hidden" name="enabled" value={String(enabled)} />
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
                <Label htmlFor="enabled" className="cursor-pointer">
                  {enabled ? (
                    <span className="font-medium text-[#D4A017]">
                      Agente activo
                    </span>
                  ) : (
                    "Agente desactivado"
                  )}
                </Label>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════
           2. Configuración general
           ═════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUpSmall}>
          <Card>
            <CardHeader>
              <CardTitle>Configuración general</CardTitle>
              <CardDescription>
                Número de teléfono y prompt del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phoneNumber">Número de teléfono</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="+5491100000000"
                  defaultValue={config.phoneNumber}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="systemPrompt">Prompt del sistema</Label>
                <Textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  rows={8}
                  placeholder="Sos el asistente virtual de Mrs Muzzarella..."
                  defaultValue={config.systemPrompt}
                  className="resize-none"
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════
           3. YCloud Credentials
           ═════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUpSmall}>
          <Card>
            <CardHeader>
              <CardTitle>Credenciales YCloud</CardTitle>
              <CardDescription>
                API Key de YCloud y número del bot de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ycloudApiKey">
                  YCloud Business API Key
                </Label>
                <div className="relative">
                  <Input
                    id="ycloudApiKey"
                    name="ycloudApiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk_..."
                    defaultValue={config.ycloudApiKey}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showApiKey ? "Ocultar API key" : "Mostrar API key"
                    }
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="whatsappBotNumber">
                  Número del bot (WhatsApp ID)
                </Label>
                <Input
                  id="whatsappBotNumber"
                  name="whatsappBotNumber"
                  placeholder="+5491100000000"
                  defaultValue={config.whatsappBotNumber}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════
           4. Allowed Phone IDs
           ═════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUpSmall}>
          <Card>
            <CardHeader>
              <CardTitle>IDs de teléfono permitidos</CardTitle>
              <CardDescription>
                Personas autorizadas para interactuar con el bot (CEO, empleados).
                Si no agregás ninguno, el bot responde a todos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Hidden input — serializa el array como JSON */}
              <input
                type="hidden"
                name="allowedPhoneIds"
                value={JSON.stringify(allowedPhoneIds)}
              />

              {/* Add row */}
              <div className="flex items-end gap-2">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label htmlFor="newName" className="text-xs">
                    Nombre
                  </Label>
                  <Input
                    id="newName"
                    placeholder="Ej: Juan Pérez"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addPhoneId())
                    }
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label htmlFor="newPhone" className="text-xs">
                    Teléfono
                  </Label>
                  <Input
                    id="newPhone"
                    placeholder="+5491100000000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addPhoneId())
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addPhoneId}
                  className="shrink-0"
                  aria-label="Agregar ID permitido"
                >
                  <Plus size={18} />
                </Button>
              </div>

              {/* Lista */}
              {allowedPhoneIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay IDs permitidos. Todos los números pueden hablar con el
                  bot.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {allowedPhoneIds.map((entry) => (
                    <div
                      key={entry.phone}
                      className="flex items-center justify-between rounded-md border border-[#D4A017]/20 bg-white/[0.02] px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {entry.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {entry.phone}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoneId(entry.phone)}
                        className="text-muted-foreground hover:text-red-400 transition-colors"
                        aria-label={`Eliminar ${entry.name}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════
           5. Horarios de atención
           ═════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUpSmall}>
          <Card>
            <CardHeader>
              <CardTitle>Horarios de atención</CardTitle>
              <CardDescription>
                Configurá los días y horarios en que el agente responde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-1 text-xs font-medium text-muted-foreground">
                  <span>Día</span>
                  <span className="w-16 text-center">Abierto</span>
                  <span className="w-24 text-center">Apertura</span>
                  <span className="w-24 text-center">Cierre</span>
                </div>

                {businessHours.map((bh) => (
                  <BusinessHourRow key={bh.day} businessHour={bh} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════
           6. Ventana 24hs
           ═════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUpSmall}>
          <Card>
            <CardHeader>
              <CardTitle>Ventana de 24hs</CardTitle>
              <CardDescription>
                Auto-responder cuando un cliente escribe fuera de la ventana de
                24hs de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="hidden"
                  name="autoReply24h"
                  value={String(autoReply24h)}
                />
                <Switch
                  id="autoReply24h"
                  checked={autoReply24h}
                  onCheckedChange={setAutoReply24h}
                />
                <Label htmlFor="autoReply24h" className="cursor-pointer">
                  {autoReply24h
                    ? "Auto-respuesta activada"
                    : "Auto-respuesta desactivada"}
                </Label>
              </div>

              {autoReply24h && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="autoReply24hMessage">
                    Mensaje automático
                  </Label>
                  <Textarea
                    id="autoReply24hMessage"
                    name="autoReply24hMessage"
                    rows={3}
                    placeholder="¡Hola! Gracias por contactarte con Mrs Muzzarella. Actualmente no estamos en horario de atención, pero tu mensaje será respondido a la brevedad."
                    defaultValue={config.autoReply24hMessage}
                    className="resize-none"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════
           7. Train Bot
           ═════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUpSmall}>
          <Card>
            <CardHeader>
              <CardTitle>Entrenar Bot</CardTitle>
              <CardDescription>
                Agregá contexto adicional (productos nuevos, promociones, etc.)
                para que el bot lo tenga en cuenta en sus respuestas
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trainBotContext">
                  Contexto adicional
                </Label>
                <Textarea
                  id="trainBotContext"
                  name="trainBotContext"
                  rows={4}
                  placeholder="Ej: Esta semana tenemos promo 2x1 en hamburguesas clásicas..."
                  defaultValue={config.trainBotContext}
                  className="resize-none"
                  onChange={(e) => setTrainBotContext(e.target.value)}
                />
              </div>

              {/* Preview del system prompt */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPreview ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                  {showPreview ? "Ocultar" : "Mostrar"} vista previa del
                  prompt del sistema
                </button>

                {showPreview && (
                  <pre className="mt-2 max-h-60 overflow-auto rounded-md border border-white/10 bg-black/40 p-3 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                    {combinedSystemPrompt}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════
            8. WhatsApp Agent — Editor de Prompt
            ═════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUpSmall}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle size={18} className="text-[#25D366]" />
                Editor de Prompt — WhatsApp Agent
              </CardTitle>
              <CardDescription>
                Personalizá el comportamiento del agente. El prompt V2 base siempre está activo;
                estos valores se agregan como instrucciones adicionales.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* System Prompt override */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="whatsappSystemPrompt">System Prompt personalizado</Label>
                <Textarea
                  id="whatsappSystemPrompt"
                  name="whatsappSystemPrompt"
                  rows={4}
                  placeholder="Ej: Usá un tono más formal con clientes B2B..."
                  value={whatsappSystemPrompt}
                  onChange={(e) => setWhatsappSystemPrompt(e.target.value)}
                  className="resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                  Si se completa, reemplaza al prompt V2 por completo. Dejalo vacío para usar el prompt base.
                </p>
              </div>

              {/* Instrucciones adicionales */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="whatsappInstrucciones">Instrucciones adicionales</Label>
                <Textarea
                  id="whatsappInstrucciones"
                  name="whatsappInstrucciones"
                  rows={3}
                  placeholder="Ej: Preguntá siempre si quieren papas antes de cerrar el pedido..."
                  value={whatsappInstrucciones}
                  onChange={(e) => setWhatsappInstrucciones(e.target.value)}
                  className="resize-none"
                />
              </div>

              {/* Promociones activas */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="whatsappPromociones">Promociones activas</Label>
                <Textarea
                  id="whatsappPromociones"
                  name="whatsappPromociones"
                  rows={2}
                  placeholder="Ej: 2x1 en Genesis todos los martes | Combo Deli Deli + Papas $4.500"
                  value={whatsappPromociones}
                  onChange={(e) => setWhatsappPromociones(e.target.value)}
                  className="resize-none"
                />
              </div>

              {/* Zonas de delivery */}
              <div className="flex flex-col gap-3">
                <Label>Zonas de delivery</Label>
                <input
                  type="hidden"
                  name="whatsappZonasDelivery"
                  value={JSON.stringify(zonasDelivery)}
                />
                <div className="flex flex-col gap-2">
                  {zonasDelivery.map((z, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
                      <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                        <Input
                          value={z.zona}
                          onChange={(e) => {
                            const next = [...zonasDelivery];
                            next[i] = { ...next[i], zona: e.target.value };
                            setZonasDelivery(next);
                          }}
                          className="h-8 text-xs"
                          placeholder="Zona"
                        />
                        <Input
                          value={z.tiempo}
                          onChange={(e) => {
                            const next = [...zonasDelivery];
                            next[i] = { ...next[i], tiempo: e.target.value };
                            setZonasDelivery(next);
                          }}
                          className="h-8 text-xs"
                          placeholder="Tiempo"
                        />
                        <Input
                          type="number"
                          value={z.costo}
                          onChange={(e) => {
                            const next = [...zonasDelivery];
                            next[i] = { ...next[i], costo: Number(e.target.value) };
                            setZonasDelivery(next);
                          }}
                          className="h-8 text-xs"
                          placeholder="Costo"
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={z.disponible}
                            onCheckedChange={(v) => {
                              const next = [...zonasDelivery];
                              next[i] = { ...next[i], disponible: v };
                              setZonasDelivery(next);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setZonasDelivery((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setZonasDelivery((prev) => [...prev, { zona: "", disponible: true, tiempo: "30 min", costo: 0 }])}
                  className="gap-1 self-start"
                >
                  <Plus size={14} />
                  Agregar zona
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════
            9. Quick Actions
            ═════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUpSmall}>
          <Card>
            <CardHeader>
              <CardTitle>Acciones rápidas</CardTitle>
              <CardDescription>
                Herramientas útiles para probar y acceder al bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <a
                  href={
                    config.whatsappBotNumber
                      ? `https://wa.me/${config.whatsappBotNumber.replace(/[^0-9]/g, "")}`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    "btn-gold inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full transition-opacity hover:opacity-90",
                    !config.whatsappBotNumber &&
                      "pointer-events-none opacity-50"
                  )}
                >
                  <ExternalLink size={16} />
                  Hablar con el Bot
                </a>

                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={handleTestConfig}
                  disabled={testState.loading}
                >
                  <Play size={16} />
                  {testState.loading ? "Verificando..." : "Test configuración"}
                </Button>
              </div>

              {/* Resultado del test */}
              {testState.result && (
                <div
                  className={clsx(
                    "mt-4 flex items-start gap-2 rounded-md border p-3 text-sm",
                    testState.result.success
                      ? "border-green-500/30 bg-green-500/5 text-green-400"
                      : "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
                  )}
                >
                  {testState.result.success ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  )}
                  <span className="whitespace-pre-line">
                    {testState.result.message}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ═════════════════════════════════════════════════════════════════════════
         Submit — sticky bottom bar, always visible
         ═════════════════════════════════════════════════════════════════════════ */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-4 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm px-4 py-3 flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="btn-gold min-w-[160px] transition-opacity hover:opacity-90"
        >
          {isPending ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </form>
  );
}

// ─── Business Hour Row ────────────────────────────────────────────────────────

function BusinessHourRow({
  businessHour,
}: {
  businessHour: BusinessHour;
}) {
  const { day, open, openTime, closeTime } = businessHour;
  const [isOpen, setIsOpen] = useState(open);

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-md border px-3 py-2 transition-colors hover:bg-white/[0.02]">
      <span className="text-sm font-medium">{day}</span>

      <div className="flex w-16 justify-center">
        <input
          type="hidden"
          name={`businessHours.${day}.open`}
          value={String(isOpen)}
        />
        <Switch
          id={`businessHours.${day}.open`}
          checked={isOpen}
          onCheckedChange={setIsOpen}
          aria-label={`${day} abierto`}
        />
      </div>

      <Input
        id={`businessHours.${day}.openTime`}
        name={`businessHours.${day}.openTime`}
        type="time"
        defaultValue={openTime}
        className="w-24"
        aria-label={`${day} hora de apertura`}
      />

      <Input
        id={`businessHours.${day}.closeTime`}
        name={`businessHours.${day}.closeTime`}
        type="time"
        defaultValue={closeTime}
        className="w-24"
        aria-label={`${day} hora de cierre`}
      />
    </div>
  );
}
