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
};

export default async function AgentPage() {
  const rows = await db
    .select({
      systemPrompt: agentConfig.systemPrompt,
      phoneNumber: agentConfig.phoneNumber,
      enabled: agentConfig.enabled,
      businessHours: agentConfig.businessHours,
    })
    .from(agentConfig)
    .where(eq(agentConfig.id, 1))
    .limit(1);

  const row = rows[0];

  const config: AgentConfigFormData = row
    ? {
        systemPrompt: row.systemPrompt ?? "",
        phoneNumber: row.phoneNumber ?? "",
        enabled: row.enabled,
        businessHours:
          Array.isArray(row.businessHours) && row.businessHours.length > 0
            ? (row.businessHours as BusinessHour[])
            : DEFAULT_BUSINESS_HOURS,
      }
    : DEFAULT_CONFIG;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Agente de WhatsApp
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurá el comportamiento del agente de IA
        </p>
      </div>
      <AgentConfigForm config={config} />
    </div>
  );
}
