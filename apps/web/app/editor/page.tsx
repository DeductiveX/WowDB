"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, CheckCircle2, Clock, Rows3, Download, History,
  Bookmark, Sparkles, Table2, BarChart3, Loader2,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { SqlEditor } from "@/components/sql-editor";
import { DataTable } from "@/components/data-table";
import { ResultChart } from "@/components/result-chart";
import { SaveQueryDialog } from "@/components/save-query-dialog";
import { ParamsDialog } from "@/components/params-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { NlSqlBar } from "@/components/ai/nl-sql-bar";
import { AIResultPanel } from "@/components/ai/ai-result-panel";
import { AIProviderDialog } from "@/components/ai/ai-provider-dialog";
import { api } from "@/lib/api";
import { getAISettings, streamCompletion } from "@/lib/ai";
import { useStream } from "@/lib/use-stream";
import { PROMPTS, serializeSchema } from "@/lib/ai-prompts";
import { addQueryToHistory } from "@/lib/query-history";
import type { Connection, QueryResult, SchemaContext } from "@/lib/types";

function extractParams(sql: string): string[] {
  const matches = sql.matchAll(/:(\w+)/g);
  return Array.from(new Set(Array.from(matches).map(m => m[1])));
}

function substituteParams(sql: string, values: Record<string, string>): string {
  return sql.replace(/:(\w+)/g, (_, name) => {
    const v = values[name];
    if (v === undefined) return `:${name}`;
    if (!isNaN(Number(v))) return v;
    return `'${v.replace(/'/g, "''")}'`;
  });
}

function EditorContent() {
  const searchParams = useSearchParams();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [database, setDatabase] = useState("");
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("SELECT * FROM clientes");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [schemaCtx, setSchemaCtx] = useState<SchemaContext | null>(null);
  const [view, setView] = useState<"table" | "chart">("table");
  const [showSave, setShowSave] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [pendingRunSql, setPendingRunSql] = useState<string | null>(null);
  const [askPrompt, setAskPrompt] = useState("");
  const [askLoading, setAskLoading] = useState(false);

  const explain = useStream();
  const optimize = useStream();

  useEffect(() => {
    api.listConnections().then(setConnections);
  }, []);

  useEffect(() => {
    if (connections.length === 0) return;
    const connParam = searchParams.get("conn");
    const qParam = searchParams.get("q");
    const askParam = searchParams.get("ask");
    if (qParam) setQuery(qParam);
    if (askParam) setAskPrompt(askParam);
    if (connParam) {
      const id = Number(connParam);
      if (connections.find((c) => c.id === id)) {
        setSelectedId(id);
        return;
      }
    }
    setSelectedId((cur) => cur ?? connections[0].id);
  }, [searchParams, connections]);

  useEffect(() => {
    if (!selectedId) return;
    const conn = connections.find((c) => c.id === selectedId);
    if (conn?.db_type === "sqlite" || conn?.db_type === "duckdb") {
      setPassword("__sqlite__");
    } else {
      const saved = sessionStorage.getItem(`pwd_${selectedId}`);
      if (saved) setPassword(saved);
    }
    if (conn?.database) setDatabase(conn.database);
  }, [selectedId, connections]);

  const selectedConn = useMemo(
    () => connections.find((c) => c.id === selectedId),
    [connections, selectedId],
  );
  const isLocalDb = selectedConn?.db_type === "sqlite" || selectedConn?.db_type === "duckdb";

  useEffect(() => {
    if (!selectedId) { setSchemaCtx(null); return; }
    if (!isLocalDb && (!database || !password)) { setSchemaCtx(null); return; }
    api.getAIContext(selectedId, database, password || "")
      .then(setSchemaCtx)
      .catch(() => setSchemaCtx(null));
  }, [selectedId, database, password, isLocalDb]);

  const params = useMemo(() => extractParams(query), [query]);

  const doExecute = async (sqlToRun: string) => {
    if (!selectedId) return;
    if (!isLocalDb && !password) return;
    setLoading(true);
    explain.reset();
    optimize.reset();
    try {
      const res = await api.executeQuery(selectedId, sqlToRun, password, database || undefined);
      setResult(res);
      setView("table");
      const conn = connections.find((c) => c.id === selectedId);
      addQueryToHistory({
        query: sqlToRun,
        connectionId: selectedId,
        connectionName: conn?.name ?? String(selectedId),
        database: database || null,
        blocked: res.blocked,
        blockReason: res.reason ?? null,
        rowCount: res.count,
        elapsedMs: res.elapsed_ms,
      });
    } catch (e: unknown) {
      const reason = e instanceof Error ? e.message : "Unknown error";
      setResult({ success: false, blocked: false, reason, columns: [], rows: [], count: 0, elapsed_ms: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (params.length > 0) {
      setPendingRunSql(query);
      setShowParams(true);
      return;
    }
    await doExecute(query);
  };

  const handleParamsRun = (values: Record<string, string>) => {
    const filled = substituteParams(pendingRunSql ?? query, values);
    setPendingRunSql(null);
    doExecute(filled);
  };

  const handleExplain = async () => {
    const settings = getAISettings();
    if (!settings || !query.trim()) return;
    optimize.reset();
    const schema = schemaCtx ? serializeSchema(schemaCtx) : "";
    const system = schema ? PROMPTS.explainQuery(schema) : PROMPTS.explainQueryNoSchema();
    await explain.run([{ role: "system", content: system }, { role: "user", content: query }], settings);
  };

  const handleOptimize = async () => {
    const settings = getAISettings();
    if (!settings || !query.trim() || !schemaCtx) return;
    explain.reset();
    await optimize.run([
      { role: "system", content: PROMPTS.optimizeQuery(serializeSchema(schemaCtx)) },
      { role: "user", content: query },
    ], settings);
  };

  const handleAsk = async () => {
    const settings = getAISettings();
    if (!settings || !askPrompt.trim() || !schemaCtx) return;
    setAskLoading(true);
    try {
      const schema = serializeSchema(schemaCtx);
      const sys = `You are a SQL expert. Given a database schema and a user question in natural language, produce ONE read-only SQL query (SELECT/SHOW/DESCRIBE/EXPLAIN only). Return ONLY the SQL, no markdown, no explanation, no semicolon.\n\nSCHEMA:\n${schema}`;
      let sql = "";
      for await (const chunk of streamCompletion([
        { role: "system", content: sys },
        { role: "user", content: askPrompt },
      ], settings)) {
        sql += chunk;
      }
      sql = sql.replace(/```sql/gi, "").replace(/```/g, "").trim();
      setQuery(sql);
      setAskPrompt("");
      await doExecute(sql);
    } finally {
      setAskLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!result?.rows.length) return;
    const header = result.columns.join(",");
    const rows = result.rows.map((r) =>
      result.columns.map((c) => {
        const v = String(r[c] ?? "");
        return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "query-result.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (!result?.rows.length) return;
    const json = JSON.stringify(result.rows, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "query-result.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const schemaText = schemaCtx ? serializeSchema(schemaCtx) : "";
  const aiConfigured = !!getAISettings();

  return (
    <div className="flex flex-col">
      <AppHeader
        title="SQL Editor"
        description="Read-only query execution · use :param for placeholders"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setShowSave(true)}
              disabled={!query.trim()}
            >
              <Bookmark className="h-3.5 w-3.5" /> Save
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground">
              <Link href="/history"><History className="h-3.5 w-3.5" /> History</Link>
            </Button>
            <AIProviderDialog>
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground">
                ✦ {aiConfigured ? "AI ✓" : "AI Setup"}
              </Button>
            </AIProviderDialog>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Connection selector */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5">
            <Label className="text-xs">Connection</Label>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              <option value="">Select connection</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.db_type})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Database</Label>
            <Input className="h-9 w-40" placeholder="database name" value={database} onChange={(e) => setDatabase(e.target.value)} />
          </div>
          {!isLocalDb && (
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input className="h-9 w-40" type="password" placeholder="••••••••" value={password === "__sqlite__" ? "" : password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
        </div>

        {/* Ask AI bar */}
        {aiConfigured && schemaCtx && (
          <div className="flex items-center gap-2 rounded-lg border bg-gradient-to-r from-primary/5 via-background to-background p-2.5">
            <Sparkles className="h-4 w-4 text-primary shrink-0 ml-1" />
            <Input
              placeholder="Ask AI: what do you want to know? (e.g. 'top 5 customers by total spent')"
              value={askPrompt}
              onChange={(e) => setAskPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !askLoading && handleAsk()}
              className="h-8 border-0 bg-transparent focus-visible:ring-0 text-sm"
            />
            <Button size="sm" onClick={handleAsk} disabled={!askPrompt.trim() || askLoading} className="gap-1.5">
              {askLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Ask
            </Button>
          </div>
        )}

        {/* NL → SQL bar */}
        <NlSqlBar schemaText={schemaText} onResult={setQuery} />

        <SqlEditor
          value={query}
          onChange={setQuery}
          onRun={handleRun}
          onExplain={handleExplain}
          onOptimize={schemaCtx ? handleOptimize : undefined}
          loading={loading}
        />

        {params.length > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            ⚠ This query has {params.length} parameter{params.length > 1 ? "s" : ""}: {params.map(p => <code key={p} className="font-mono mx-0.5">:{p}</code>)} — you&apos;ll be prompted to fill them when running.
          </div>
        )}

        <AIResultPanel title="Explain" text={explain.text} streaming={explain.streaming} error={explain.error} onStop={explain.stop} onClose={explain.reset} />
        <AIResultPanel title="Optimize" text={optimize.text} streaming={optimize.streaming} error={optimize.error} onStop={optimize.stop} onClose={optimize.reset} />

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {result.blocked ? (
                <div className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Blocked: {result.reason}</span>
                </div>
              ) : result.success ? (
                <>
                  <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Query executed</span>
                  </div>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Rows3 className="h-3 w-3" /> {result.count} rows
                  </Badge>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Clock className="h-3 w-3" /> {result.elapsed_ms}ms
                  </Badge>
                  {result.normalized_query && result.normalized_query !== query && (
                    <Badge variant="warning" className="text-xs">LIMIT auto-applied</Badge>
                  )}

                  <div className="ml-auto flex items-center gap-1">
                    {/* View toggle */}
                    {result.rows.length > 0 && (
                      <div className="flex rounded-md border overflow-hidden mr-1">
                        <button
                          onClick={() => setView("table")}
                          className={`px-2 py-1 text-xs flex items-center gap-1 ${view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                        >
                          <Table2 className="h-3 w-3" /> Table
                        </button>
                        <button
                          onClick={() => setView("chart")}
                          className={`px-2 py-1 text-xs flex items-center gap-1 ${view === "chart" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                        >
                          <BarChart3 className="h-3 w-3" /> Chart
                        </button>
                      </div>
                    )}
                    {result.rows.length > 0 && (
                      <>
                        <Button size="sm" variant="outline" onClick={handleExportCsv} className="h-7 text-xs gap-1">
                          <Download className="h-3 w-3" /> CSV
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleExportJson} className="h-7 text-xs gap-1">
                          <Download className="h-3 w-3" /> JSON
                        </Button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{result.reason}</span>
                </div>
              )}
            </div>

            {result.success && !result.blocked && result.columns.length > 0 && (
              view === "table"
                ? <DataTable columns={result.columns} rows={result.rows} />
                : <ResultChart columns={result.columns} rows={result.rows} />
            )}
            {result.success && !result.blocked && result.columns.length === 0 && (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Query returned no results.</CardContent></Card>
            )}
          </div>
        )}

        {!result && !explain.text && !optimize.text && (
          <EmptyState
            title="Run a query"
            description="Write SQL directly, describe it in plain language, or ⌘K to search."
          />
        )}
      </div>

      <SaveQueryDialog
        open={showSave}
        onClose={() => setShowSave(false)}
        query={query}
        connectionId={selectedId}
        database={database || null}
      />
      <ParamsDialog
        open={showParams}
        onClose={() => setShowParams(false)}
        params={params}
        onRun={handleParamsRun}
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorContent />
    </Suspense>
  );
}
