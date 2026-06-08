"use client";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Rows3 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { SqlEditor } from "@/components/sql-editor";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import type { Connection, QueryResult } from "@/lib/types";

export default function EditorPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [database, setDatabase] = useState("");
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("SELECT * FROM clientes");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listConnections().then((list) => {
      setConnections(list);
      if (list.length > 0) setSelectedId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const saved = sessionStorage.getItem(`pwd_${selectedId}`);
    if (saved) setPassword(saved);
    const conn = connections.find((c) => c.id === selectedId);
    if (conn?.database) setDatabase(conn.database);
  }, [selectedId, connections]);

  const handleRun = async () => {
    if (!selectedId || !password) return;
    setLoading(true);
    try {
      const res = await api.executeQuery(selectedId, query, password, database || undefined);
      setResult(res);
    } catch (e: unknown) {
      setResult({
        success: false,
        blocked: false,
        reason: e instanceof Error ? e.message : "Unknown error",
        columns: [],
        rows: [],
        count: 0,
        elapsed_ms: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader title="SQL Editor" description="Read-only query execution" />

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
            <Input
              className="h-9 w-40"
              placeholder="database name"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Password</Label>
            <Input
              className="h-9 w-40"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <SqlEditor value={query} onChange={setQuery} onRun={handleRun} loading={loading} />

        {/* Result */}
        {result && (
          <div className="space-y-3">
            {/* Status bar */}
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

        {!result && (
          <EmptyState
            title="Run a query"
            description="Write a SELECT, SHOW, DESCRIBE or EXPLAIN query and press Run."
          />
        )}
      </div>
    </div>
  );
}
