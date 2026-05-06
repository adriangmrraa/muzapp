import { BufferManager, type BufferedMessage } from "./manager";
import { BUFFER_CONFIG, type Channel } from "./config";

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Maximum recursive re-processing depth — prevents infinite loops when messages
// keep arriving mid-processing (e.g. a very chatty user).
const MAX_REPROCESS_DEPTH = 3;

// Main processing function — called after enqueue
export async function scheduleBufferProcessing(
  channel: Channel,
  userId: string,
  processCallback: (messages: BufferedMessage[]) => Promise<void>
): Promise<void> {
  // Try to acquire lock — if someone else is processing, bail
  const locked = await BufferManager.acquireLock(channel, userId);
  if (!locked) {
    console.log(`[buffer:lock] Lock already held for ${channel}:${userId}, skipping`);
    return; // another processor is handling this user
  }

  console.log(`[buffer:lock] Acquired lock for ${channel}:${userId}`);

  try {
    await processBufferLoop(channel, userId, processCallback, 0);
  } finally {
    await BufferManager.releaseLock(channel, userId);
    console.log(`[buffer:lock] Released lock for ${channel}:${userId}`);
  }
}

async function processBufferLoop(
  channel: Channel,
  userId: string,
  processCallback: (messages: BufferedMessage[]) => Promise<void>,
  depth: number
): Promise<void> {
  if (depth >= MAX_REPROCESS_DEPTH) {
    console.warn(
      `[buffer:interrupt] Max reprocess depth (${MAX_REPROCESS_DEPTH}) reached for ${channel}:${userId}, stopping recursion`
    );
    return;
  }

  const config = BUFFER_CONFIG[channel];

  // Wait for the debounce timer to expire (sliding window)
  let attempts = 0;
  const maxAttempts = Math.ceil(config.debounceMs / 1000) + 5; // safety limit

  while (attempts < maxAttempts) {
    const expired = await BufferManager.isTimerExpired(channel, userId);
    if (expired) break;

    await sleep(1000); // check every second
    attempts++;
  }

  // Fetch all buffered messages
  const messages = await BufferManager.fetchAndClear(channel, userId);

  if (messages.length === 0) return;

  console.log(
    `[buffer:process] Start — ${messages.length} msgs for ${channel}:${userId} (depth=${depth})`
  );

  try {
    await processCallback(messages);
    console.log(`[buffer:process] Done for ${channel}:${userId} (depth=${depth})`);
  } catch (err) {
    console.error(
      `[buffer:process] Callback error for ${channel}:${userId} (depth=${depth}):`,
      err
    );
    // Don't re-throw — we still need to check for new messages and release the lock cleanly
  }

  // GRACEFUL INTERRUPTION: check if new messages arrived during processing
  const hasNew = await BufferManager.hasNewMessages(channel, userId);
  if (hasNew) {
    console.log(
      `[buffer:interrupt] New messages during processing for ${channel}:${userId}, re-processing (depth=${depth + 1})`
    );
    await processBufferLoop(channel, userId, processCallback, depth + 1);
  }
}
