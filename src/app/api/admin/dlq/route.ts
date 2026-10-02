import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDLQMessages, clearDLQ } from "@/lib/queue/dlq";

async function requireAdmin() {
  const session = await auth();
  return session ?? null;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const messages = await getDLQMessages();
    return NextResponse.json({
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("[api/admin/dlq] GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve DLQ messages" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await clearDLQ();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/dlq] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to clear DLQ" },
      { status: 500 },
    );
  }
}
