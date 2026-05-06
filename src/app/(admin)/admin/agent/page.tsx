import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import AgentConfigForm, { type AgentConfigFormData, type BusinessHour } from "./agent-config-form";

export const metadata = {
  title: "Agente — Mrs Muzzarella Admin",
};

const DEFAULT_BUSINESS_HOURS: BusinessHour[] = [
  { day: "Lunes", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Martes", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Miércoles", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Jueves", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Viernes", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Sábado", open: true, openTime: "09:00", closeTime: "22:00" },
  { day: "Domingo", open: false, openTime: "09:00", closeTime: "22:00" },
];

const DEFAULT_CONFIG: AgentConfigFormData = {
  systemPrompt: "",
  phoneNumber: "",
  enabled: false,
  businessHours: DEFAULT_BUSINESS_HOURS,
  ycloudApiKey: "",
  whatsappBotNumber: "",
  allowedPhoneIds: [],
  autoReply24h: false,
  autoReply24hMessage: "",
  trainBotContext: "",
};

export default async function AgentPage() {
  // Use raw select to avoid Drizzle type issues with new columns
  const rows = await db
    .select()
    .from(agentConfig)
    .where(eq(agentConfig.id, 1))
    .limit(1);

  const row = rows[0] as Record<string, unknown> | undefined;

  const config: AgentConfigFormData = row
    ? {
        systemPrompt: (row.systemPrompt as string) ?? "",
        phoneNumber: (row.phoneNumber as string) ?? "",
        enabled: (row.enabled as boolean) ?? false,
        businessHours:
          Array.isArray(row.businessHours) && (row.businessHours as unknown[]).length > 0
            ? (row.businessHours as BusinessHour[])
            : DEFAULT_BUSINESS_HOURS,
        ycloudApiKey: (row.ycloudApiKey as string) ?? "",
        whatsappBotNumber: (row.whatsappBotNumber as string) ?? "",
        allowedPhoneIds: Array.isArray(row.allowedPhoneIds)
          ? (row.allowedPhoneIds as { name: string; phone: string }[])
          : [],
        autoReply24h: (row.autoReply24h as boolean) ?? false,
        autoReply24hMessage: (row.autoReply24hMessage as string) ?? "",
        trainBotContext: (row.trainBotContext as string) ?? "",
      }
    : DEFAULT_CONFIG;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gold-gradient">
          Agente de WhatsApp
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurá el comportamiento del agente de IA — credenciales, prompt, IDs permitidos y más
        </p>
      </div>
      <AgentConfigForm config={config} />
    </div>
  );
}
