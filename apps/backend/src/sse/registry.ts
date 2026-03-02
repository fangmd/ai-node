/**
 * Per-user SSE connection registry. Only events for a user are sent to that user's connections.
 */
import type { SSEStreamingApi } from 'hono/streaming';

type StreamEntry = { stream: SSEStreamingApi; id: number };

const userStreams = new Map<string, Set<StreamEntry>>();
let nextId = 0;

function getOrCreateSet(userId: string): Set<StreamEntry> {
  let set = userStreams.get(userId);
  if (!set) {
    set = new Set();
    userStreams.set(userId, set);
  }
  return set;
}

export function add(userId: string, stream: SSEStreamingApi): () => void {
  const id = ++nextId;
  const entry: StreamEntry = { stream, id };
  getOrCreateSet(userId).add(entry);
  return () => remove(userId, entry);
}

function remove(userId: string, entry: StreamEntry): void {
  const set = userStreams.get(userId);
  if (set) {
    set.delete(entry);
    if (set.size === 0) userStreams.delete(userId);
  }
}

/**
 * Push an SSE event to all connections for the given user. Removes closed streams on write failure.
 */
export async function pushToUser(
  userId: string,
  event: string,
  data: Record<string, unknown> | string
): Promise<void> {
  const set = userStreams.get(userId);
  if (!set || set.size === 0) return;
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  const toRemove: StreamEntry[] = [];
  for (const entry of set) {
    try {
      await entry.stream.writeSSE({ event, data: dataStr });
    } catch {
      toRemove.push(entry);
    }
  }
  toRemove.forEach((e) => {
    set.delete(e);
    if (set.size === 0) userStreams.delete(userId);
  });
}
