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
};
