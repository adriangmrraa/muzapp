type HistoryTurn = { role: string; content: string; platformMessageId?: string | null };
type BufferedTurn = { content: string; messageId?: string };
/** Persisted inbound turns are identified by provider ID, including media whose
 * stored placeholder differs from the analyzed text queued in the buffer. */
export function mergeBufferedTurn<T extends HistoryTurn>(history: T[], buffered: BufferedTurn[]): { role: T["role"] | "user"; content: string }[] {
  if (!buffered.length) return history.map(({ role, content }) => ({ role, content }));
  const ids = new Set(buffered.map((m) => m.messageId).filter((id): id is string => !!id));
  const result = history.filter((turn) => !(turn.role === "user" && turn.platformMessageId && ids.has(turn.platformMessageId)))
    .map(({ role, content }) => ({ role, content }));
  // Fallback when provider IDs were not saved (older records). Remove only an
  // exact trailing run; never remove an unrelated earlier identical message.
  const missingIds = buffered.filter((m) => !m.messageId || !history.some((turn) => turn.platformMessageId === m.messageId));
  let matched = 0;
  for (let i = result.length - 1; i >= 0 && matched < missingIds.length; i--) {
    const incoming = missingIds[missingIds.length - 1 - matched];
    if (result[i].role !== "user" || result[i].content !== incoming.content) break;
    matched++;
  }
  if (matched) result.splice(result.length - matched, matched);
  return [...result, { role: "user", content: buffered.map((m) => m.content).join("\n") }];
}
