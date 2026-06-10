"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Trash2, ExternalLink, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { getQueryHistory, clearQueryHistory, type QueryHistoryEntry } from "@/lib/query-history";

export default function HistoryPage() {
  const [entries, setEntries] = useState<QueryHistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getQueryHistory());
  }, []);

  const handleClear = () => {
    clearQueryHistory();
    setEntries([]);
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Query History"
        description={`${entries.length} queries stored locally`}
        actions={
          entries.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </Button>
          ) : undefined
        }
      />

      <div className="p-6">
        {entries.length === 0 ? (
          <EmptyState
            title="No query history"
            description="Queries you run in the SQL Editor will appear here."
            action={
              <Button asChild size="sm">
                <Link href="/editor">Open SQL Editor</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border bg-card p-4 space-y-2 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed flex-1">
                    {entry.query}
                  </pre>
                  <Link
                    href={`/editor?q=${encodeURIComponent(entry.query)}&conn=${entry.connectionId}`}
                    title="Open in editor"
                  >
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {entry.blocked ? (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>Blocked{entry.blockReason ? `: ${entry.blockReason}` : ""}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{entry.rowCount} rows · {entry.elapsedMs}ms</span>
                    </div>
                  )}

                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{entry.connectionName}</Badge>
                  {entry.database && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">{entry.database}</Badge>
                  )}
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(entry.executedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
