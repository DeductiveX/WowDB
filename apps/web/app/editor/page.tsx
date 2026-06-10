"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Rows3, Download, History } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { SqlEditor } from "@/components/sql-editor";
import { DataTable } from "@/components/data-table";
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
import { getAISettings } from "@/lib/ai";
import { useStream } from "@/lib/use-stream";
import { PROMPTS, serializeSchema } from "@/lib/ai-prompts";
import { addQueryToHistory } from "@/lib/query-history";
import type { Connection, QueryResult, SchemaContext } from "@/lib/types";

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

  const explain = useStream();
  const optimize = useStream();

  useEffect(() => {
    api.listConnections().then(setConnections);
  }, []);

  // React to ?q=/?conn= changes (e.g. clicking a query in /history while editor is already open)
  useEffect(() => {
    if (connections.length === 0) return;
    const connParam = searchParams.get("conn");
    const qParam = searchParams.get("q");
    if (qParam) setQuery(qParam);
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
    if (conn?.db_type === "sqlite") {
      setPassword("__sqlite__");
    } else {
      const saved = sessionStorage.getItem(`pwd_${selectedId}`);
      if (saved) setPassword(saved);
    }
    if (conn?.database) setDatabase(conn.database);
  }, [selectedId, connections]);

  const isSqlite = (() => {
    const conn = connections.find((c) => c.id === selectedId);
    return conn?.db_type === "sqlite";
  })();

  useEffect(() => {
    if (!selectedId) { setSchemaCtx(null); return; }
    if (!isSqlite && (!database || !password)) { setSchemaCtx(null); return; }
    api.getAIContext(selectedId, database, password || "")
      .then(setSchemaCtx)
      .catch(() => setSchemaCtx(null));
  }, [selectedId, database, password, isSqlite]);

  const handleRun = async () => {
    if (!selectedId) return;
    if (!isSqlite && !password) return;
    setLoading(true);
    explain.reset();
    optimize.reset();
    try {
      const res = await api.executeQuery(selectedId, query, password, database || undefined);
      setResult(res);
      const conn = connections.find((c) => c.id === selectedId);
      addQueryToHistory({
        query,
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
      const conn = connections.find((c) => c.id === selectedId);
      addQueryToHistory({
        query,
        connectionId: selectedId,
        connectionName: conn?.name ?? String(selectedId),
        database: database || null,
        blocked: false,
        blockReason: reason,
        rowCount: 0,
        elapsedMs: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    const settings = getAISettings();
    if (!settings || !query.trim()) return;
    optimize.reset();
    const schema = schemaCtx ? serializeSchema(schemaCtx) : "";
    const system = schema ? PROMPTS.explainQuery(schema) : PROMPTS.explainQueryNoSchema();
    await explain.run(
      [{ role: "system", content: system }, { role: "user", content: query }],
      settings
    );
  };

  const handleOptimize = async () => {
    const settings = getAISettings();
    if (!settings || !query.trim() || !schemaCtx) return;
    explain.reset();
    await optimize.run(
      [
        { role: "system", content: PROMPTS.optimizeQuery(serializeSchema(schemaCtx)) },
        { role: "user", content: query },
      ],
      settings
    );
  };

  const handleExportCsv = () => {
    if (!result?.rows.length) return;
    const header = result.columns.join(",");
    const rows = result.rows.map((r) =>
      result.columns.map((c) => {
        const v = String(r[c] ?? "");
        return v.includes(",") || v.includes('"') || v.includes("\n")
          ? `"${v.replace(/"/g, '""')}"` : v;
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

  return (
    <div className="flex flex-col">
      <AppHeader
        title="SQL Editor"
        description="Read-only query execution"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground">
              <Link href="/history"><History className="h-3.5 w-3.5" /> History</Link>
            </Button>
            <AIProviderDialog>
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground">
                ✦ {getAISettings() ? "AI ✓" : "AI Setup"}
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
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Database</Label>
            <Input className="h-9 w-40" placeholder="database name" value={database} onChange={(e) => setDatabase(e.target.value)} />
          </div>
          {!isSqlite && (
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input className="h-9 w-40" type="password" placeholder="••••••••" value={password === "__sqlite__" ? "" : password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
        </div>

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

        {/* AI panels */}
        <AIResultPanel title="Explain" text={explain.text} streaming={explain.streaming} error={explain.error} onStop={explain.stop} onClose={explain.reset} />
        <AIResultPanel title="Optimize" text={optimize.text} streaming={optimize.streaming} error={optimize.error} onStop={optimize.stop} onClose={optimize.reset} />

        {/* Result */}
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
                  {result.rows.length > 0 && (
                    <div className="ml-auto flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={handleExportCsv} className="h-7 text-xs gap-1">
                        <Download className="h-3 w-3" /> CSV
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleExportJson} className="h-7 text-xs gap-1">
                        <Download className="h-3 w-3" /> JSON
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{result.reason}</span>
                </div>
              )}
            </div>

            {result.success && !result.blocked && result.columns.length > 0 && (
              <DataTable columns={result.columns} rows={result.rows} />
            )}
            {result.success && !result.blocked && result.columns.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Query returned no results.
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!result && !explain.text && !optimize.text && (
          <EmptyState
            title="Run a query"
            description="Write SQL directly, or describe it in plain language above."
          />
        )}
      </div>
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
