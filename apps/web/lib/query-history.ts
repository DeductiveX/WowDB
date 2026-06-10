const HISTORY_KEY = "wowdb_query_history";
const MAX_ENTRIES = 50;

export interface QueryHistoryEntry {
  id: string;
  query: string;
  connectionId: number;
  connectionName: string;
  database: string | null;
  blocked: boolean;
  blockReason: string | null;
  rowCount: number;
  elapsedMs: number;
  executedAt: string;
}

export function getQueryHistory(): QueryHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as QueryHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addQueryToHistory(entry: Omit<QueryHistoryEntry, "id" | "executedAt">): void {
  if (typeof window === "undefined") return;
  const history = getQueryHistory();
  const newEntry: QueryHistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    executedAt: new Date().toISOString(),
  };
  const updated = [newEntry, ...history].slice(0, MAX_ENTRIES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearQueryHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}
