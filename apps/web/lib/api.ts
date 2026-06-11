import type {
  Connection,
  ConnectionTestResult,
  SessionCreateResult,
  TableInfo,
  TableDetail,
  PreviewResult,
  QueryResult,
  DocsResult,
  HealthResult,
  ErdData,
  SchemaContext,
  ApiKey,
  ApiKeyCreated,
  DBType,
  SavedQuery,
  PIIFinding,
  SearchResults,
  Webhook,
  WebhookDelivery,
  ScheduledTask,
  Snapshot,
  SnapshotDiff,
  QualityMonitor,
  QualityAssertion,
} from "./types";

export interface ConnectionPayload {
  db_type: DBType;
  host?: string;
  port?: number;
  db_path?: string;
  database?: string;
  user?: string;
  password?: string;
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(
  path: string,
  options: RequestInit = {},
  password?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (password) {
    headers["X-DB-Password"] = password;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export const api = {
  health(): Promise<HealthResult> {
    return request("/health");
  },

  testConnection(data: ConnectionPayload): Promise<ConnectionTestResult> {
    return request("/api/connections/test", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  createSession(data: ConnectionPayload & { name: string }): Promise<SessionCreateResult> {
    return request("/api/connections/session", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  listConnections(): Promise<Connection[]> {
    return request("/api/connections");
  },

  getConnection(id: number): Promise<Connection> {
    return request(`/api/connections/${id}`);
  },

  deleteConnection(id: number): Promise<{ message: string }> {
    return request(`/api/connections/${id}`, { method: "DELETE" });
  },

  listDatabases(connectionId: number, password: string): Promise<{ databases: string[] }> {
    return request(`/api/connections/${connectionId}/databases`, {}, password);
  },

  listTables(connectionId: number, database: string, password: string): Promise<{ tables: TableInfo[]; database: string }> {
    return request(`/api/connections/${connectionId}/tables?database=${encodeURIComponent(database)}`, {}, password);
  },

  describeTable(connectionId: number, table: string, database: string, password: string): Promise<TableDetail> {
    return request(
      `/api/connections/${connectionId}/tables/${encodeURIComponent(table)}?database=${encodeURIComponent(database)}`,
      {},
      password
    );
  },

  previewTable(connectionId: number, table: string, database: string, password: string, limit = 100): Promise<PreviewResult> {
    return request(
      `/api/connections/${connectionId}/tables/${encodeURIComponent(table)}/preview?database=${encodeURIComponent(database)}&limit=${limit}`,
      {},
      password
    );
  },

  executeQuery(connectionId: number, query: string, password: string, database?: string): Promise<QueryResult> {
    return request(
      "/api/query",
      { method: "POST", body: JSON.stringify({ connection_id: connectionId, query, database }) },
      password
    );
  },

  generateDocs(connectionId: number, database: string, password: string): Promise<DocsResult> {
    return request(`/api/docs/${connectionId}?database=${encodeURIComponent(database)}`, {}, password);
  },

  getErd(connectionId: number, database: string, password: string): Promise<ErdData> {
    return request(`/api/connections/${connectionId}/erd?database=${encodeURIComponent(database)}`, {}, password);
  },

  getAIContext(connectionId: number, database: string, password: string): Promise<SchemaContext> {
    return request(`/api/connections/${connectionId}/ai-context?database=${encodeURIComponent(database)}`, {}, password);
  },

  listApiKeys(): Promise<ApiKey[]> {
    return request("/api/keys");
  },

  createApiKey(name: string): Promise<ApiKeyCreated> {
    return request("/api/keys", { method: "POST", body: JSON.stringify({ name }) });
  },

  deleteApiKey(id: number): Promise<{ message: string }> {
    return request(`/api/keys/${id}`, { method: "DELETE" });
  },

  // Saved queries
  listSavedQueries(): Promise<SavedQuery[]> {
    return request("/api/saved-queries");
  },
  createSavedQuery(data: {
    name: string; query_text: string; tags?: string;
    description?: string; connection_id?: number; database?: string;
  }): Promise<SavedQuery> {
    return request("/api/saved-queries", { method: "POST", body: JSON.stringify(data) });
  },
  updateSavedQuery(id: number, data: Partial<{
    name: string; query_text: string; tags: string;
    description: string; connection_id: number; database: string;
  }>): Promise<SavedQuery> {
    return request(`/api/saved-queries/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteSavedQuery(id: number): Promise<{ message: string }> {
    return request(`/api/saved-queries/${id}`, { method: "DELETE" });
  },

  // Global search
  search(q: string): Promise<SearchResults> {
    return request(`/api/search?q=${encodeURIComponent(q)}`);
  },

  // PII scan
  scanPII(connectionId: number, database: string, password: string): Promise<{ database: string; findings: PIIFinding[]; count: number }> {
    return request(
      `/api/connections/${connectionId}/scan-pii?database=${encodeURIComponent(database)}`,
      {},
      password
    );
  },

  // Webhooks
  listWebhooks(): Promise<Webhook[]> { return request("/api/webhooks"); },
  createWebhook(data: { name: string; url: string; events?: string; secret?: string }): Promise<Webhook> {
    return request("/api/webhooks", { method: "POST", body: JSON.stringify(data) });
  },
  updateWebhook(id: number, data: Partial<{ name: string; url: string; events: string; secret: string; is_active: boolean }>): Promise<Webhook> {
    return request(`/api/webhooks/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteWebhook(id: number): Promise<{ message: string }> {
    return request(`/api/webhooks/${id}`, { method: "DELETE" });
  },
  testWebhook(id: number): Promise<{ message: string }> {
    return request(`/api/webhooks/${id}/test`, { method: "POST" });
  },
  webhookDeliveries(id: number): Promise<WebhookDelivery[]> {
    return request(`/api/webhooks/${id}/deliveries`);
  },

  // Scheduled tasks
  listScheduledTasks(): Promise<ScheduledTask[]> { return request("/api/scheduled-tasks"); },
  createScheduledTask(data: {
    name: string; cron: string;
    task_type?: "query" | "snapshot" | "quality";
    connection_id?: number; database?: string;
    query_text?: string; monitor_id?: number;
  }): Promise<ScheduledTask> {
    return request("/api/scheduled-tasks", { method: "POST", body: JSON.stringify(data) });
  },
  updateScheduledTask(id: number, data: Partial<{ name: string; cron: string; is_active: boolean; query_text: string }>): Promise<ScheduledTask> {
    return request(`/api/scheduled-tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteScheduledTask(id: number): Promise<{ message: string }> {
    return request(`/api/scheduled-tasks/${id}`, { method: "DELETE" });
  },
  runScheduledTask(id: number): Promise<{ message: string }> {
    return request(`/api/scheduled-tasks/${id}/run`, { method: "POST" });
  },

  // Snapshots
  listSnapshots(connectionId?: number, database?: string): Promise<Snapshot[]> {
    const qs: string[] = [];
    if (connectionId !== undefined) qs.push(`connection_id=${connectionId}`);
    if (database !== undefined) qs.push(`database=${encodeURIComponent(database)}`);
    return request(`/api/snapshots${qs.length ? "?" + qs.join("&") : ""}`);
  },
  createSnapshot(connectionId: number, database: string, password: string): Promise<Snapshot> {
    return request(
      "/api/snapshots",
      { method: "POST", body: JSON.stringify({ connection_id: connectionId, database }) },
      password,
    );
  },
  deleteSnapshot(id: number): Promise<{ message: string }> {
    return request(`/api/snapshots/${id}`, { method: "DELETE" });
  },
  diffSnapshots(a: number, b: number): Promise<SnapshotDiff> {
    return request(`/api/snapshots/diff?a=${a}&b=${b}`);
  },

  // Quality monitors
  listQualityMonitors(): Promise<QualityMonitor[]> { return request("/api/quality-monitors"); },
  createQualityMonitor(data: {
    name: string; connection_id: number; database: string;
    query_text: string; assertion: QualityAssertion; threshold?: string;
  }): Promise<QualityMonitor> {
    return request("/api/quality-monitors", { method: "POST", body: JSON.stringify(data) });
  },
  deleteQualityMonitor(id: number): Promise<{ message: string }> {
    return request(`/api/quality-monitors/${id}`, { method: "DELETE" });
  },
  checkQualityMonitor(id: number, password: string): Promise<{ passed: boolean; value: string; expected: string; message: string }> {
    return request(`/api/quality-monitors/${id}/check`, { method: "POST" }, password);
  },
};
