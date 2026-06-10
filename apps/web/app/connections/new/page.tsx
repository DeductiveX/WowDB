"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { DBType } from "@/lib/types";

const DB_TYPES: { value: DBType; label: string; defaultPort: number | null }[] = [
  { value: "mysql", label: "MySQL", defaultPort: 3306 },
  { value: "postgres", label: "PostgreSQL", defaultPort: 5432 },
  { value: "sqlite", label: "SQLite (local file)", defaultPort: null },
];

interface FormState {
  name: string;
  db_type: DBType;
  host: string;
  port: string;
  db_path: string;
  database: string;
  user: string;
  password: string;
}

const defaults: FormState = {
  name: "",
  db_type: "mysql",
  host: "localhost",
  port: "3306",
  db_path: "",
  database: "",
  user: "root",
  password: "",
};

export default function NewConnectionPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaults);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number | null } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleDbTypeChange = (newType: DBType) => {
    const def = DB_TYPES.find((t) => t.value === newType);
    setForm((f) => ({
      ...f,
      db_type: newType,
      port: def?.defaultPort ? String(def.defaultPort) : "",
      user: newType === "sqlite" ? "" : f.user || "root",
      password: newType === "sqlite" ? "" : f.password,
    }));
    setTestResult(null);
    setErrors({});
  };

  const isSqlite = form.db_type === "sqlite";

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Required";
    if (isSqlite) {
      if (!form.db_path.trim()) e.db_path = "Required";
    } else {
      if (!form.host.trim()) e.host = "Required";
      if (!form.user.trim()) e.user = "Required";
      if (!form.password.trim()) e.password = "Required";
      const port = Number(form.port);
      if (isNaN(port) || port < 1 || port > 65535) e.port = "Invalid port";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    db_type: form.db_type,
    host: isSqlite ? undefined : form.host,
    port: isSqlite ? undefined : Number(form.port),
    db_path: isSqlite ? form.db_path : undefined,
    database: form.database || undefined,
    user: isSqlite ? undefined : form.user,
    password: isSqlite ? undefined : form.password,
  });

  const handleTest = async () => {
    if (!validate()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.testConnection(buildPayload());
      setTestResult({ success: result.success, message: result.message, latency: result.latency_ms });
    } catch (e: unknown) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await api.createSession({ name: form.name, ...buildPayload() });
      if (typeof window !== "undefined") {
        if (isSqlite) {
          // SQLite has no password — mark the session as authenticated so downstream
          // pages don't show the "Session expired" prompt.
          sessionStorage.setItem(`pwd_${result.connection_id}`, "__sqlite__");
        } else {
          sessionStorage.setItem(`pwd_${result.connection_id}`, form.password);
        }
      }
      router.push(`/connections/${result.connection_id}`);
    } catch (e: unknown) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : "Failed to create session" });
    } finally {
      setSaving(false);
    }
  };

  const selectedType = DB_TYPES.find((t) => t.value === form.db_type)!;

  return (
    <div className="flex flex-col">
      <AppHeader title="New Connection" description="Connect to a relational database" />

      <div className="p-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Database Connection</CardTitle>
            <CardDescription>Passwords are held in memory only and never stored to disk.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* DB Type selector */}
            <div className="space-y-1.5">
              <Label>Database type</Label>
              <div className="flex gap-2">
                {DB_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleDbTypeChange(t.value)}
                    className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                      form.db_type === t.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Connection name */}
            <div className="space-y-1.5">
              <Label>Connection name</Label>
              <Input placeholder="My Database" value={form.name} onChange={set("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* SQLite path */}
            {isSqlite ? (
              <div className="space-y-1.5">
                <Label>File path</Label>
                <Input placeholder="/path/to/database.db" value={form.db_path} onChange={set("db_path")} />
                {errors.db_path && <p className="text-xs text-destructive">{errors.db_path}</p>}
                <p className="text-xs text-muted-foreground">Absolute path to the .db / .sqlite file accessible by the WowDB API server.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Host</Label>
                    <Input placeholder="localhost" value={form.host} onChange={set("host")} />
                    {errors.host && <p className="text-xs text-destructive">{errors.host}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Port</Label>
                    <Input placeholder={String(selectedType.defaultPort)} value={form.port} onChange={set("port")} />
                    {errors.port && <p className="text-xs text-destructive">{errors.port}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Database (optional)</Label>
                  <Input placeholder="Leave blank to list all" value={form.database} onChange={set("database")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Username</Label>
                  <Input placeholder="root" value={form.user} onChange={set("user")} />
                  {errors.user && <p className="text-xs text-destructive">{errors.user}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
              </>
            )}

            {/* Security notice */}
            {!isSqlite && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Use a <strong>read-only user</strong> for safety. WowDB enforces read-only access, but a dedicated user adds an extra layer of protection.
                </p>
              </div>
            )}

            {/* Test result */}
            {testResult && (
              <div className={`flex items-center gap-2 rounded-md p-2.5 text-sm ${testResult.success ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                <span>{testResult.message}</span>
                {testResult.latency && (
                  <Badge variant="outline" className="ml-auto text-[10px]">{testResult.latency}ms</Badge>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={handleTest} disabled={testing} className="flex-1">
                {testing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Test Connection
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Start Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
