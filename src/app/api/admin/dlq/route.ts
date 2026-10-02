import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getDLQMessages, clearDLQ } from "@/lib/queue/dlq";

export async function GET() {
  const session = await auth();
  if (!session) {
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
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
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
