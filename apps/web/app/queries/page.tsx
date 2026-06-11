"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2, Play, Pencil, Search, Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import type { SavedQuery } from "@/lib/types";

export default function SavedQueriesPage() {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [search, setSearch] = useState("");

  const load = () => api.listSavedQueries().then(setQueries).catch(() => null);

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this saved query?")) return;
    await api.deleteSavedQuery(id);
    load();
  };

  const filtered = queries.filter(q =>
    !search.trim() ||
    q.name.toLowerCase().includes(search.toLowerCase()) ||
    q.query_text.toLowerCase().includes(search.toLowerCase()) ||
    (q.tags ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const allTags = Array.from(new Set(
    queries.flatMap(q => (q.tags ?? "").split(",").map(t => t.trim()).filter(Boolean))
  )).sort();

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Saved Queries"
        description={`${queries.length} saved · use :param for placeholders`}
        actions={
          <Button asChild size="sm">
            <Link href="/editor"><Plus className="h-3.5 w-3.5 mr-1.5" /> New from editor</Link>
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, tag or query content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSearch(tag)}
                className="rounded-full border bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            title={queries.length === 0 ? "No saved queries yet" : "No matches"}
            description={queries.length === 0
              ? "Save queries from the SQL Editor for quick reuse."
              : "Try a different search."
            }
            action={queries.length === 0 ? (
              <Button asChild><Link href="/editor">Open SQL Editor</Link></Button>
            ) : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(q => {
              const params = Array.from(q.query_text.matchAll(/:(\w+)/g)).map(m => m[1]);
              const uniqueParams = Array.from(new Set(params));
              return (
                <Card key={q.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Bookmark className="h-4 w-4 text-primary shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm">{q.name}</h3>
                          {uniqueParams.length > 0 && (
                            <Badge variant="warning" className="text-[10px]">
                              {uniqueParams.length} param{uniqueParams.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                          {q.tags && q.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">#{tag}</Badge>
                          ))}
                        </div>
                        {q.description && (
                          <p className="text-xs text-muted-foreground mt-1">{q.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          title="Open in editor"
                        >
                          <Link href={`/editor?q=${encodeURIComponent(q.query_text)}${q.connection_id ? `&conn=${q.connection_id}` : ""}`}>
                            <Play className="h-3 w-3" /> Run
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(q.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <pre className="text-xs font-mono bg-muted/40 rounded p-2.5 overflow-x-auto whitespace-pre-wrap break-all max-h-32">
                      {q.query_text}
                    </pre>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Updated {new Date(q.updated_at).toLocaleString()}</span>
                      {q.database && <span className="font-mono">DB: {q.database}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
