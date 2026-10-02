import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  try {
    // Simple DB test - just try to select
    await db.select().from(users).limit(1);
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      db: "connected",
    });
  } catch (error) {
    console.error("[api/health] DB check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        db: "unreachable",
      },
      { status: 500 }
    );
  }
}