import { z } from "zod";

export const agentConfigSchema = z.object({
  systemPrompt: z
    .string()
    .min(10, "El system prompt debe tener al menos 10 caracteres")
    .max(5000, "El system prompt no puede superar 5000 caracteres"),
  phoneNumber: z
    .string()
    .min(10, "El número de teléfono debe tener al menos 10 dígitos"),
  ycloudApiKey: z.string().optional(),
  enabled: z.boolean().default(false),
});

export type AgentConfigFormData = z.infer<typeof agentConfigSchema>;
