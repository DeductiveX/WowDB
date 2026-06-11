"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Table2, Search, ChevronRight, Lock, Loader2, GitFork, MessageSquare } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { ChatPanel } from "@/components/ai/chat-panel";
import { PIIScanner } from "@/components/pii-scanner";
import { Camera } from "lucide-react";
import { api } from "@/lib/api";
import { connectionLabel } from "@/lib/utils";
import type { Connection, TableInfo, SchemaContext } from "@/lib/types";

export default function ConnectionExplorerPage() {
  const { id } = useParams<{ id: string }>();
  const connId = Number(id);
  const router = useRouter();

  const [connection, setConnection] = useState<Connection | null>(null);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [databases, setDatabases] = useState<string[]>([]);
  const [activeDb, setActiveDb] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [schemaCtx, setSchemaCtx] = useState<SchemaContext | null>(null);

  useEffect(() => {
    api.getConnection(connId).then((c) => {
      setConnection(c);
      // SQLite has no password — auto-authenticate so the explorer doesn't gate on a password prompt.
      if (c.db_type === "sqlite" || c.db_type === "duckdb") {
        setPassword("__sqlite__");
        sessionStorage.setItem(`pwd_${connId}`, "__sqlite__");
      }
    }).catch(() => router.push("/connections"));
    const saved = sessionStorage.getItem(`pwd_${connId}`);
    if (saved) setPassword(saved);
  }, [connId, router]);

  const handleAuth = async () => {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.listDatabases(connId, password);
      setDatabases(res.databases);
      setAuthenticated(true);
      sessionStorage.setItem(`pwd_${connId}`, password);
      if (connection?.database) {
        setActiveDb(connection.database);
        loadTables(connection.database);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async (db: string) => {
    setActiveDb(db);
    setTables([]);
    setLoading(true);
    setSchemaCtx(null);
    try {
      const res = await api.listTables(connId, db, password);
      setTables(res.tables);
      api.getAIContext(connId, db, password)
        .then(setSchemaCtx)
        .catch(() => setSchemaCtx(null));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  // Auto-authenticate once both connection + password are available (e.g. on reload, or for sqlite)
  useEffect(() => {
    if (!authenticated && !loading && connection && password) {
      handleAuth();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, password]);

  const filtered = tables.filter((t) =>
    t.TABLE_NAME.toLowerCase().includes(search.toLowerCase())
  );

  if (!connection) return <LoadingState message="Loading connection..." />;

  return (
    <>
      <div className="flex flex-col">
        <AppHeader
          title={connection.name}
          description={connectionLabel(connection)}
          actions={
            activeDb && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await api.createSnapshot(connId, activeDb, password);
                      alert("Snapshot captured. See Automations → Snapshots.");
                    } catch (e) {
                      alert(`Failed: ${e instanceof Error ? e.message : "unknown"}`);
                    }
                  }}
                  title="Capture schema snapshot now"
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5" /> Snapshot
                </Button>
                <PIIScanner connectionId={connId} database={activeDb} password={password} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChatOpen(true)}
                  title="AI Chat"
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> AI Chat
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/connections/${connId}/erd?database=${activeDb}`}>
                    <GitFork className="mr-1.5 h-3.5 w-3.5" /> ERD
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/docs/${connId}?db=${activeDb}`}>
                    Generate Docs
                  </Link>
                </Button>
              </div>
            )
          }
        />

        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Sidebar databases */}
          <div className="w-48 shrink-0 border-r overflow-y-auto p-3 space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
              Databases
            </p>
            {authenticated
              ? databases.map((db) => (
                  <button
                    key={db}
                    onClick={() => loadTables(db)}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                      activeDb === db
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    {db}
                  </button>
                ))
              : <p className="text-xs text-muted-foreground px-2">Auth required</p>}
          </div>

          {/* Main */}
          <div className="flex-1 overflow-y-auto p-6">
            {!authenticated ? (
              <Card className="max-w-sm">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Enter Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Password for <span className="font-mono">{connection.user}</span></Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                    />
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button onClick={handleAuth} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ) : !activeDb ? (
              <EmptyState title="Select a database" description="Choose a database from the left panel to explore its tables." />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search tables..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Badge variant="secondary" className="text-xs">{filtered.length} tables</Badge>
                </div>

                {loading && <LoadingState />}
                {!loading && filtered.length === 0 && (
                  <EmptyState title="No tables found" description={search ? "Try a different search." : "This database has no tables."} />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filtered.map((table) => (
                    <Link
                      key={table.TABLE_NAME}
                      href={`/connections/${connId}/tables/${table.TABLE_NAME}?database=${activeDb}`}
                      onClick={() => sessionStorage.setItem(`pwd_${connId}`, password)}
                    >
                      <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Table2 className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-mono text-sm font-medium truncate">{table.TABLE_NAME}</span>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </div>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-[10px]">{table.ENGINE}</Badge>
                            {table.TABLE_ROWS !== null && (
                              <span className="text-[10px] text-muted-foreground">~{table.TABLE_ROWS} rows</span>
                            )}
                          </div>
                          {table.TABLE_COMMENT && (
                            <p className="mt-1.5 text-[11px] text-muted-foreground truncate">{table.TABLE_COMMENT}</p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat panel — fixed right overlay */}
      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        schemaCtx={schemaCtx}
        database={activeDb ?? ""}
      />
      {chatOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setChatOpen(false)}
        />
      )}
    </>
  );
}
