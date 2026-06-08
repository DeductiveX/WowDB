export interface Connection {
  id: number;
  name: string;
  host: string;
  port: number;
  database: string | null;
  user: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency_ms: number | null;
}

export interface SessionCreateResult {
  connection_id: number;
  name: string;
  host: string;
  port: number;
  database: string | null;
  user: string;
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
