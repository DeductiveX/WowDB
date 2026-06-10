"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Server, Trash2, AlertCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { api } from "@/lib/api";
import { formatDate, connectionLabel } from "@/lib/utils";
import type { Connection } from "@/lib/types";

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.listConnections()
      .then(setConnections)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this connection?")) return;
    await api.deleteConnection(id);
    load();
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Connections"
        description="Manage your MySQL connections"
        actions={
          <Button asChild size="sm">
            <Link href="/connections/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Connection
            </Link>
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Privacy notice */}
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Passwords are never stored.</span>{" "}
            WowDB v0.1 keeps only connection metadata (host, port, user). You&apos;ll re-enter your password each session.
          </p>
        </div>

        {loading && <LoadingState message="Loading connections..." />}
        {error && <ErrorState message={error} />}
        {!loading && !error && connections.length === 0 && (
          <EmptyState
            title="No connections yet"
            description="Add a MySQL connection to start exploring your databases."
            action={
              <Button asChild>
                <Link href="/connections/new">
                  <Plus className="mr-2 h-4 w-4" /> New Connection
                </Link>
              </Button>
            }
          />
        )}

        {connections.map((conn) => (
          <Card key={conn.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0">
                <Server className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{conn.name}</span>
                  <Badge variant="secondary" className="text-[10px] shrink-0 uppercase">{conn.db_type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {connectionLabel(conn)}{conn.db_type !== "sqlite" && conn.database ? `/${conn.database}` : ""}
                </p>
              </div>
              <div className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                {formatDate(conn.created_at)}
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/connections/${conn.id}`}>Explore</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(conn.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
