"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { saveAgentConfig, type AgentConfigState } from "./actions";
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

  const [enabled, setEnabled] = useState(config.enabled);

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const businessHours =
    config.businessHours.length > 0 ? config.businessHours : DEFAULT_DAYS;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Estado del agente */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del agente</CardTitle>
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
            <Label htmlFor="enabled">Agente activo</Label>
          </div>
        </CardContent>
      </Card>

      {/* Configuración general */}
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
            />
          </div>
        </CardContent>
      </Card>

      {/* Horarios de atención */}
      <Card>
        <CardHeader>
          <CardTitle>Horarios de atención</CardTitle>
          <CardDescription>
            Configurá los días y horarios en que el agente responde
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {/* Header row */}
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

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </form>
  );
}

function BusinessHourRow({ businessHour }: { businessHour: BusinessHour }) {
  const { day, open, openTime, closeTime } = businessHour;
  const [isOpen, setIsOpen] = useState(open);

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-md border px-3 py-2">
      <span className="text-sm font-medium">{day}</span>

      <div className="flex w-16 justify-center">
        <input type="hidden" name={`businessHours.${day}.open`} value={String(isOpen)} />
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
