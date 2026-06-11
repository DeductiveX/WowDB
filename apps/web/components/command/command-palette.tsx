"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Database, Code2, Bookmark, History, Settings, Home, Plus,
  Sparkles, Loader2, ArrowRight, Hash,
} from "lucide-react";
import { api } from "@/lib/api";
import { getQueryHistory } from "@/lib/query-history";
import type { SearchResults } from "@/lib/types";

interface Item {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  url?: string;
  onSelect?: () => void;
  group: "Connections" | "Saved Queries" | "Recent Queries" | "Pages" | "Actions";
}

const PAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home, database: Database, code: Code2, bookmark: Bookmark,
  history: History, settings: Settings, plus: Plus,
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults>({ connections: [], saved_queries: [], pages: [] });
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open via Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      api.search("").then(setResults).catch(() => null);
    }
  }, [open]);

  // Search debounced
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(() => {
      api.search(q).then(setResults).catch(() => null).finally(() => setLoading(false));
    }, 150);
    return () => clearTimeout(t);
  }, [q, open]);

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];

    // Connections
    for (const c of results.connections) {
      out.push({
        id: `conn-${c.id}`,
        title: c.name,
        subtitle: c.db_type === "sqlite" || c.db_type === "duckdb"
          ? c.db_path ?? ""
          : c.host ?? "",
        icon: Database,
        badge: c.db_type.toUpperCase(),
        url: c.url,
        group: "Connections",
      });
    }
    // Saved queries
    for (const sq of results.saved_queries) {
      out.push({
        id: `sq-${sq.id}`,
        title: sq.name,
        subtitle: sq.preview,
        icon: Bookmark,
        badge: sq.tags ?? undefined,
        url: sq.url,
        group: "Saved Queries",
      });
    }
    // Recent queries (client-side from localStorage)
    if (typeof window !== "undefined") {
      const hist = getQueryHistory().slice(0, 6);
      const qLower = q.toLowerCase();
      for (const h of hist) {
        if (!q || h.query.toLowerCase().includes(qLower)) {
          out.push({
            id: `hist-${h.id}`,
            title: h.query.slice(0, 80),
            subtitle: `${h.connectionName} · ${new Date(h.executedAt).toLocaleString()}`,
            icon: History,
            url: `/editor?q=${encodeURIComponent(h.query)}&conn=${h.connectionId}`,
            group: "Recent Queries",
          });
        }
      }
    }
    // Pages
    for (const p of results.pages) {
      out.push({
        id: `page-${p.url}`,
        title: p.title,
        subtitle: p.description,
        icon: PAGE_ICONS[p.icon] ?? Hash,
        url: p.url,
        group: "Pages",
      });
    }
    // AI actions (only if there's a query)
    if (q.trim()) {
      out.push({
        id: "ai-ask",
        title: `Ask AI: "${q}"`,
        subtitle: "Generate SQL from natural language",
        icon: Sparkles,
        url: `/editor?ask=${encodeURIComponent(q)}`,
        group: "Actions",
      });
    }
    return out;
  }, [results, q]);

  // Group items
  const grouped = useMemo(() => {
    const g: Record<string, Item[]> = {};
    for (const it of items) {
      (g[it.group] ||= []).push(it);
    }
    return g;
  }, [items]);

  const flatList = useMemo(() => items, [items]);

  useEffect(() => {
    if (activeIdx >= flatList.length) setActiveIdx(0);
  }, [flatList, activeIdx]);

  const selectItem = (it: Item) => {
    setOpen(false);
    if (it.onSelect) it.onSelect();
    else if (it.url) router.push(it.url);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[10vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-xl border bg-popover shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b px-4 py-3.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(i + 1, flatList.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (flatList[activeIdx]) selectItem(flatList[activeIdx]);
              }
            }}
            placeholder="Search connections, tables, queries, pages…  ask AI…"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto py-2">
          {flatList.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No results
            </div>
          ) : (
            Object.entries(grouped).map(([group, gItems]) => (
              <div key={group} className="mb-2">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </div>
                <div className="space-y-0.5 px-2">
                  {gItems.map((it) => {
                    const idx = flatList.indexOf(it);
                    const active = idx === activeIdx;
                    const Icon = it.icon;
                    return (
                      <button
                        key={it.id}
                        onClick={() => selectItem(it)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                          active ? "bg-accent text-accent-foreground" : "hover:bg-accent/40"
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{it.title}</div>
                          {it.subtitle && (
                            <div className="text-[11px] text-muted-foreground truncate font-mono">
                              {it.subtitle}
                            </div>
                          )}
                        </div>
                        {it.badge && (
                          <span className="text-[9px] uppercase rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
                            {it.badge}
                          </span>
                        )}
                        <ArrowRight className={`h-3 w-3 shrink-0 ${active ? "opacity-100" : "opacity-0"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1 font-mono">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1 font-mono">↵</kbd> open</span>
          </div>
          <span className="flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> Type to ask AI
          </span>
        </div>
      </div>
    </div>
  );
}
