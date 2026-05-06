import { NextResponse } from "next/server";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET() {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      );
    }

    // 2. Load agent config
    const rows = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);

    const config = rows[0];

    if (!config) {
      return NextResponse.json({
        success: false,
        message: "No hay configuración del agente",
        checks: {
          hasConfig: false,
          hasApiKey: false,
          hasPhoneNumber: false,
          enabled: false,
        },
      });
    }

    // 3. Run checks
    const apiKey = config.ycloudApiKey || process.env.YCLOUD_API_KEY || "";
    const checks = {
      hasConfig: true,
      hasApiKey: apiKey.length > 0,
      hasPhoneNumber: (config.phoneNumber ?? "").length > 0,
      enabled: config.enabled,
    };

    const allPassed = Object.values(checks).every(Boolean);

    // 4. If all good, try a lightweight API call to YCloud
    let ycloudStatus: "ok" | "error" | "skipped" = "skipped";
    let ycloudDetail = "";

    if (allPassed && apiKey) {
      try {
        const ycRes = await fetch(
          "https://api.ycloud.com/v2/whatsapp/messages",
          {
            method: "HEAD",
            headers: { "X-API-Key": apiKey },
          }
        );
        if (ycRes.ok || ycRes.status === 405) {
          // 405 = Method Not Allowed is expected for HEAD on messages endpoint - means API key is valid
          ycloudStatus = "ok";
          ycloudDetail = "API key válida";
        } else if (ycRes.status === 401) {
          ycloudStatus = "error";
          ycloudDetail = "API key inválida (401)";
        } else {
          ycloudStatus = "error";
          ycloudDetail = `Respuesta inesperada: ${ycRes.status}`;
        }
      } catch {
        ycloudStatus = "error";
        ycloudDetail = "No se pudo conectar con YCloud";
      }
    }

    return NextResponse.json({
      success: allPassed && ycloudStatus === "ok",
      message: allPassed
        ? ycloudStatus === "ok"
          ? "✅ Configuración correcta — API key válida"
          : ycloudStatus === "error"
            ? `⚠️ ${ycloudDetail}`
            : "⚠️ No se pudo verificar la API key"
        : "❌ Faltan datos de configuración",
      checks,
      ycloudStatus,
      ycloudDetail,
    });
  } catch (error) {
    console.error("[test-agent] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
