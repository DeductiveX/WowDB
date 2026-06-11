"use client";
import { useState } from "react";
import { Shield, ShieldAlert, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { PIIFinding } from "@/lib/types";

interface Props {
  connectionId: number;
  database: string;
  password: string;
}

const KIND_COLORS: Record<string, string> = {
  email: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  phone: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  cpf: "bg-red-500/10 text-red-600 dark:text-red-400",
  cnpj: "bg-red-500/10 text-red-600 dark:text-red-400",
  password: "bg-rose-600/10 text-rose-700 dark:text-rose-400",
  secret: "bg-rose-600/10 text-rose-700 dark:text-rose-400",
  card: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  bank: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  name: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  address: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  birthdate: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  salary: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  postal_code: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  ip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
};

export function PIIScanner({ connectionId, database, password }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<PIIFinding[] | null>(null);

  const scan = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const res = await api.scanPII(connectionId, database, password);
      setFindings(res.findings);
    } catch {
      setFindings([]);
    } finally {
      setLoading(false);
    }
  };

  const grouped = (findings ?? []).reduce<Record<string, PIIFinding[]>>((acc, f) => {
    (acc[f.table] ||= []).push(f);
    return acc;
  }, {});

  return (
    <>
      <Button variant="outline" size="sm" onClick={scan} className="gap-1.5">
        <Shield className="h-3.5 w-3.5" /> Scan PII
      </Button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-2xl rounded-xl border bg-popover shadow-2xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">PII Scan — {database}</span>
                {findings && (
                  <Badge variant={findings.length > 0 ? "warning" : "success"} className="text-[10px]">
                    {findings.length} finding{findings.length === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Scanning schema for likely PII columns…
                </div>
              ) : findings && findings.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  ✓ No obvious PII patterns detected.
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Heuristic scan based on column names + types. Always verify before relying on it.
                  </p>
                  {Object.entries(grouped).map(([table, items]) => (
                    <div key={table} className="rounded-md border bg-card/40 p-3 space-y-2">
                      <div className="font-mono text-sm font-medium">{table}</div>
                      <div className="space-y-1">
                        {items.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={`rounded px-1.5 py-0.5 font-medium ${KIND_COLORS[f.kind] ?? "bg-muted text-muted-foreground"}`}>
                              {f.kind}
                            </span>
                            <span className="font-mono">{f.column}</span>
                            <span className="text-muted-foreground font-mono">{f.type}</span>
                            <span className="ml-auto text-muted-foreground">{Math.round(f.confidence * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
