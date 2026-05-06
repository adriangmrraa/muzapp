import { NextResponse } from "next/server";
import { getDLQMessages, clearDLQ } from "@/lib/queue/dlq";

export async function GET() {
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
