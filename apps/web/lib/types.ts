export type DBType = "mysql" | "postgres" | "sqlite" | "duckdb";

export interface SavedQuery {
  id: number;
  name: string;
  description: string | null;
  query_text: string;
  tags: string | null;
  connection_id: number | null;
  database: string | null;
  created_at: string;
  updated_at: string;
}

export interface PIIFinding {
  table: string;
  column: string;
  kind: string;
  confidence: number;
  type: string;
}

export interface SearchPage {
  title: string;
  url: string;
  kind: "page";
  icon: string;
  description: string;
}

export interface SearchConnection {
  id: number;
  name: string;
  db_type: DBType;
  host: string | null;
  db_path: string | null;
  url: string;
}

export interface SearchSavedQuery {
  id: number;
  name: string;
  tags: string | null;
  preview: string;
  url: string;
}

export interface SearchResults {
  connections: SearchConnection[];
  saved_queries: SearchSavedQuery[];
  pages: SearchPage[];
}

// ── Automations ──────────────────────────────────────────────────────

export interface Webhook {
  id: number;
  name: string;
  url: string;
  events: string;
  is_active: boolean;
  created_at: string;
}

export interface WebhookDelivery {
  id: number;
  webhook_id: number;
  event: string;
  status_code: number | null;
  error: string | null;
  delivered_at: string;
}

export interface ScheduledTask {
  id: number;
  name: string;
  task_type: "query" | "snapshot" | "quality";
  cron: string;
  connection_id: number | null;
  database: string | null;
  query_text: string | null;
  monitor_id: number | null;
  is_active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  created_at: string;
}

export interface Snapshot {
  id: number;
  connection_id: number;
  database: string;
  table_count: number;
  column_count: number;
  captured_at: string;
}

export interface SnapshotDiff {
  tables_added: string[];
  tables_removed: string[];
  columns_added: Array<{ table: string; column: string; type: string }>;
  columns_removed: Array<{ table: string; column: string; type: string }>;
  columns_changed: Array<{ table: string; column: string; before: unknown; after: unknown }>;
}

export type QualityAssertion = "count_gt" | "count_eq" | "count_lt" | "no_nulls" | "value_min" | "value_max";

export interface QualityMonitor {
  id: number;
  name: string;
  connection_id: number;
  database: string;
  query_text: string;
  assertion: QualityAssertion;
  threshold: string | null;
  is_active: boolean;
  last_check_at: string | null;
  last_passed: boolean | null;
  last_value: string | null;
  created_at: string;
}

export interface Connection {
  id: number;
  name: string;
  db_type: DBType;
  host: string | null;
  port: number | null;
  db_path: string | null;
  database: string | null;
  user: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
}

export interface ApiKeyCreated {
  id: number;
  name: string;
  key: string;
  key_prefix: string;
  message: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency_ms: number | null;
}

export interface SessionCreateResult {
  connection_id: number;
  name: string;
  db_type: DBType;
  host: string | null;
  port: number | null;
  db_path: string | null;
  database: string | null;
  user: string | null;
  message: string;
}

export interface TableInfo {
  TABLE_NAME: string;
  TABLE_TYPE: string;
  ENGINE: string;
  TABLE_ROWS: number | null;
  TABLE_COMMENT: string;
}

export interface ColumnInfo {
  COLUMN_NAME: string;
  ORDINAL_POSITION: number;
  COLUMN_DEFAULT: string | null;
  IS_NULLABLE: string;
  DATA_TYPE: string;
  COLUMN_TYPE: string;
  COLUMN_KEY: string;
  EXTRA: string;
  COLUMN_COMMENT: string;
}

export interface IndexInfo {
  INDEX_NAME: string;
  NON_UNIQUE: number;
  SEQ_IN_INDEX: number;
  COLUMN_NAME: string;
  INDEX_TYPE: string;
}

export interface ForeignKeyInfo {
  CONSTRAINT_NAME: string;
  COLUMN_NAME: string;
  REFERENCED_TABLE_NAME: string;
  REFERENCED_COLUMN_NAME: string;
}

export interface TableDetail {
  meta: Record<string, unknown>;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreign_keys: ForeignKeyInfo[];
}

export interface PreviewResult {
  columns: string[];
  rows: Record<string, unknown>[];
  count: number;
}

export interface QueryResult {
  success: boolean;
  blocked: boolean;
  reason: string | null;
  columns: string[];
  rows: Record<string, unknown>[];
  count: number;
  elapsed_ms: number;
  normalized_query?: string;
}

export interface DocsResult {
  database: string;
  markdown: string;
}

export interface HealthResult {
  status: string;
  service: string;
  version: string;
}

// ── AI / Schema Context ──────────────────────────────────────────────

export interface SchemaColumn {
  name: string;
  type: string;
  key: string;
  nullable: boolean;
  extra: string;
}

export interface SchemaTable {
  name: string;
  engine: string;
  row_count: number | null;
  comment: string;
  columns: SchemaColumn[];
  foreign_keys: Array<{ column: string; references: string }>;
}

export interface SchemaContext {
  database: string;
  tables: SchemaTable[];
}

// ── ERD ──────────────────────────────────────────────────────────────

export interface ErdColumn {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
  extra: string;
}

export interface ErdNode {
  id: string;
  table_name: string;
  engine: string;
  comment: string;
  row_count: number | null;
  columns: ErdColumn[];
}

export interface ErdEdge {
  id: string;
  source: string;
  source_handle: string;
  target: string;
  target_handle: string;
  kind: "fk" | "inferred";
}

export interface ErdData {
  nodes: ErdNode[];
  edges: ErdEdge[];
}
