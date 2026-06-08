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

interface FormState {
  name: string;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

const defaults: FormState = {
  name: "",
  host: "localhost",
  port: "3306",
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
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.host.trim()) e.host = "Required";
    if (!form.user.trim()) e.user = "Required";
    if (!form.password.trim()) e.password = "Required";
    const port = Number(form.port);
    if (isNaN(port) || port < 1 || port > 65535) e.port = "Invalid port";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleTest = async () => {
    if (!validate()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.testConnection({
        host: form.host,
        port: Number(form.port),
        database: form.database || undefined,
        user: form.user,
        password: form.password,
      });
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
      const result = await api.createSession({
        name: form.name,
        host: form.host,
        port: Number(form.port),
        database: form.database || undefined,
        user: form.user,
        password: form.password,
      });
      // Store password in memory for immediate use
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`pwd_${result.connection_id}`, form.password);
      }
      router.push(`/connections/${result.connection_id}`);
    } catch (e: unknown) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : "Failed to create session" });
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof FormState, label: string, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={set(key)}
        autoComplete="off"
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="flex flex-col">
      <AppHeader title="New Connection" description="Connect to a MySQL database" />

      <div className="p-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MySQL Connection</CardTitle>
            <CardDescription>Passwords are held in memory only and never stored to disk.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {field("name", "Connection name", "text", "My Database")}

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Host</Label>
                <Input placeholder="localhost" value={form.host} onChange={set("host")} />
                {errors.host && <p className="text-xs text-destructive">{errors.host}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Port</Label>
                <Input placeholder="3306" value={form.port} onChange={set("port")} />
                {errors.port && <p className="text-xs text-destructive">{errors.port}</p>}
              </div>
            </div>

            {field("database", "Database (optional)", "text", "Leave blank to list all")}
            {field("user", "Username", "text", "root")}
            {field("password", "Password", "password", "••••••••")}

            {/* Security notice */}
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Use a <strong>read-only MySQL user</strong> for safety. WowDB enforces read-only access, but a dedicated user adds an extra layer of protection.
              </p>
            </div>

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
