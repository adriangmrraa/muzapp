import { NextResponse } from "next/server";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const rows = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No hay configuración de agente guardada" },
        { status: 404 }
      );
    }

    const config = rows[0];
    const issues: string[] = [];

    if (!config.ycloudApiKey) {
      issues.push("Falta YCloud API Key");
    }
    if (!config.phoneNumber) {
      issues.push("Falta número de teléfono");
    }
    if (!config.systemPrompt) {
      issues.push("Falta prompt del sistema");
    }

    if (issues.length > 0) {
      return NextResponse.json(
        {
          status: "incomplete",
          message: "Configuración incompleta",
          issues,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: `Configuración OK — Bot ${config.enabled ? "activo" : "inactivo"}, Tel: ${config.phoneNumber}`,
    });
  } catch (error) {
    console.error("Error testing agent config:", error);
    return NextResponse.json(
      { error: "Error al verificar la configuración" },
      { status: 500 }
    );
  }
}
