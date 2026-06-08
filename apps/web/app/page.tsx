"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Shield, Code2, FileText, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

const features = [
  { icon: Database, title: "Schema Explorer", desc: "Browse databases, tables, columns, indexes and foreign keys visually." },
  { icon: Shield, title: "Query Guard", desc: "AST-level SQL enforcement. Only SELECT, SHOW, DESCRIBE and EXPLAIN are allowed." },
  { icon: Code2, title: "SQL Editor", desc: "Read-only SQL editor with automatic LIMIT enforcement and friendly error messages." },
  { icon: FileText, title: "Markdown Docs", desc: "Generate schema documentation in Markdown with one click." },
];

const roadmap = [
  { version: "v0.1", label: "MySQL read-only workbench", done: true },
  { version: "v0.2", label: "PostgreSQL + improved ERD", done: false },
  { version: "v0.3", label: "AI explain (Ollama / OpenAI optional)", done: false },
  { version: "v0.4", label: "MCP server for AI agents", done: false },
  { version: "v0.5", label: "Credit Intelligence Pack", done: false },
];

export default function HomePage() {
  const [apiVersion, setApiVersion] = useState<string | null>(null);

  useEffect(() => {
    api.health().then((h) => setApiVersion(h.version)).catch(() => null);
  }, []);

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
              </div>
              <p className="text-muted-foreground max-w-xl">
                An AI-native open-source database workbench for relational databases.
                Explore schemas, run read-only queries, and generate documentation — safely.
              </p>
            </div>
            <Button asChild>
              <Link href="/connections/new">
                New Connection <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                {done && <Badge variant="outline" className="ml-auto text-[10px]">Current</Badge>}
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" asChild size="sm">
            <Link href="/connections">View Connections</Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link href="/editor">SQL Editor</Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
              API Docs
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
