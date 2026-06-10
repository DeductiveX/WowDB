"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database, Shield, Code2, FileText, GitFork, Sparkles,
  ArrowRight, CheckCircle2, Circle, Clock, ExternalLink, Plus,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Connection } from "@/lib/types";
import { connectionLabel } from "@/lib/utils";
import { getQueryHistory } from "@/lib/query-history";

const features = [
  { icon: Database, title: "Schema Explorer", desc: "Browse databases, tables, columns, indexes and foreign keys visually." },
  { icon: Shield, title: "Query Guard", desc: "AST-level SQL enforcement. Only SELECT, SHOW, DESCRIBE and EXPLAIN are allowed." },
  { icon: Code2, title: "SQL Editor", desc: "Read-only editor with NL→SQL, Explain, Optimize and CSV/JSON export." },
  { icon: FileText, title: "Markdown Docs", desc: "Generate schema documentation in Markdown with one click." },
  { icon: GitFork, title: "ERD Diagrams", desc: "Interactive React Flow ERD with FK inference, minimap and Copy as Mermaid." },
  { icon: Sparkles, title: "AI Assistant", desc: "Chat, schema analysis, NL→SQL and AI docs via OpenAI, Anthropic or OpenRouter." },
];

const roadmap = [
  { version: "v0.1", label: "MySQL read-only workbench", done: true },
  { version: "v0.2", label: "ERD diagrams + AI assistant (OpenAI / Anthropic / OpenRouter)", done: true },
  { version: "v0.3", label: "PostgreSQL + SQLite support", done: false },
  { version: "v0.4", label: "MCP server for Claude / Cursor / N8n", done: false },
  { version: "v0.5", label: "Credit Intelligence Pack", done: false },
];

export default function HomePage() {
  const [apiVersion, setApiVersion] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [recentQueries, setRecentQueries] = useState<ReturnType<typeof getQueryHistory>>([]);

  useEffect(() => {
    api.health().then((h) => setApiVersion(h.version)).catch(() => null);
    api.listConnections().then(setConnections).catch(() => []);
    setRecentQueries(getQueryHistory().slice(0, 5));
  }, []);

  const currentVersion = [...roadmap].reverse().find((r) => r.done)?.version ?? "v0.1";

  return (
    <div className="flex flex-col">
      <AppHeader title="Dashboard" description="WowDB — AI-native database workbench" />

      <div className="p-6 space-y-8">
        {/* Hero */}
        <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-background p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  W
                </div>
                <h2 className="text-2xl font-bold tracking-tight">WowDB</h2>
                {apiVersion && (
                  <Badge variant="outline" className="text-xs">v{apiVersion}</Badge>
                )}
                <Badge variant="success" className="text-xs">{currentVersion}</Badge>
              </div>
              <p className="text-muted-foreground max-w-xl">
                AI-native open-source database workbench. Explore schemas, run read-only queries,
                generate docs and automate with AI — safely.
              </p>
            </div>
            <Button asChild>
              <Link href="/connections/new">
                <Plus className="mr-2 h-4 w-4" /> New Connection
              </Link>
            </Button>
          </div>
        </div>

        {/* Connections + Recent queries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connections */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Connections</h3>
              <Button asChild variant="ghost" size="sm" className="text-xs h-7">
                <Link href="/connections">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
            {connections.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                  <Database className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No connections yet</p>
                  <Button asChild size="sm">
                    <Link href="/connections/new">Add your first connection</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {connections.slice(0, 4).map((conn) => (
                  <Link key={conn.id} href={`/connections/${conn.id}`}>
                    <div className="flex items-center gap-3 rounded-lg border p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Database className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{conn.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{connectionLabel(conn)}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))}
                {connections.length > 4 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    +{connections.length - 4} more —{" "}
                    <Link href="/connections" className="underline underline-offset-2">view all</Link>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Recent Queries */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Queries</h3>
              {recentQueries.length > 0 && (
                <Button asChild variant="ghost" size="sm" className="text-xs h-7">
                  <Link href="/history">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              )}
            </div>
            {recentQueries.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                  <Clock className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No queries yet</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/editor">Open SQL Editor</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentQueries.map((q) => (
                  <Link key={q.id} href={`/editor?q=${encodeURIComponent(q.query)}&conn=${q.connectionId}`}>
                    <div className="flex items-start gap-3 rounded-lg border p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors cursor-pointer">
                      <Code2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono truncate text-foreground">{q.query}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(q.executedAt).toLocaleString()}
                          {q.blocked && <Badge variant="destructive" className="ml-2 text-[9px] py-0">blocked</Badge>}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-sm">{title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed">{desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Roadmap</h3>
          <div className="space-y-2">
            {roadmap.map(({ version, label, done }) => (
              <div key={version} className="flex items-center gap-3 rounded-lg border p-3">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <Badge variant={done ? "success" : "secondary"} className="text-xs shrink-0">{version}</Badge>
                <span className={`text-sm ${done ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
                {version === currentVersion && <Badge variant="outline" className="ml-auto text-[10px]">Current</Badge>}
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" asChild size="sm">
            <Link href="/connections">Connections</Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link href="/editor">SQL Editor</Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link href="/history">Query History</Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
              API Docs <ExternalLink className="ml-1.5 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
