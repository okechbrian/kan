export function retryDelay(attempt: number, baseMs = 1000, capMs = 30000) {
  if (!Number.isInteger(attempt) || attempt < 0) throw new Error("invalid_attempt");
  return Math.min(capMs, baseMs * 2 ** attempt);
}

export function shouldRetry(status: number, attempt: number, maxAttempts = 5) {
  if (attempt >= maxAttempts) return false;
  return status === 429 || status >= 500;
}

export type OutboxItem = {
  id: string;
  created_at: string;
  synced_at?: string | null;
};

export function pendingItems<T extends OutboxItem>(items: T[], limit = 50) {
  return items
    .filter((item) => !item.synced_at)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(0, limit);
}

export function markSynced<T extends OutboxItem>(items: T[], id: string, at: string) {
  return items.map((item) => (item.id === id ? { ...item, synced_at: at } : item));
}
