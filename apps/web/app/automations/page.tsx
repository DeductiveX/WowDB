"use client";
import { useEffect, useState } from "react";
import {
  Webhook as WebhookIcon, Clock, Camera, ShieldCheck,
  Plus, Trash2, Play, Send, CheckCircle2, XCircle, AlertCircle, History,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import type {
  Webhook, ScheduledTask, Snapshot, QualityMonitor, Connection, QualityAssertion,
} from "@/lib/types";

export default function AutomationsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    api.listConnections().then(setConnections).catch(() => null);
  }, []);

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Automations"
        description="Webhooks, scheduled tasks, schema snapshots and data quality monitors"
      />

      <div className="p-6">
        <Tabs defaultValue="webhooks">
          <TabsList>
            <TabsTrigger value="webhooks"><WebhookIcon className="h-3.5 w-3.5 mr-1.5" /> Webhooks</TabsTrigger>
            <TabsTrigger value="scheduled"><Clock className="h-3.5 w-3.5 mr-1.5" /> Scheduled</TabsTrigger>
            <TabsTrigger value="snapshots"><Camera className="h-3.5 w-3.5 mr-1.5" /> Snapshots</TabsTrigger>
            <TabsTrigger value="quality"><ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Quality</TabsTrigger>
          </TabsList>

          <TabsContent value="webhooks" className="mt-4"><WebhooksTab /></TabsContent>
          <TabsContent value="scheduled" className="mt-4"><ScheduledTab connections={connections} /></TabsContent>
          <TabsContent value="snapshots" className="mt-4"><SnapshotsTab connections={connections} /></TabsContent>
          <TabsContent value="quality" className="mt-4"><QualityTab connections={connections} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Webhooks ──────────────────────────────────────────────────────────

function WebhooksTab() {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [form, setForm] = useState({ name: "", url: "", events: "*", secret: "" });
  const [busy, setBusy] = useState(false);

  const load = () => api.listWebhooks().then(setHooks).catch(() => null);
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setBusy(true);
    try {
      await api.createWebhook({ ...form, secret: form.secret || undefined });
      setForm({ name: "", url: "", events: "*", secret: "" });
      load();
    } finally { setBusy(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this webhook?")) return;
    await api.deleteWebhook(id); load();
  };

  const test = async (id: number) => {
    await api.testWebhook(id);
    alert("Test event sent — check Deliveries tab on the webhook.");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Slack drift alerts" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Events (comma-separated, * for all)</Label>
              <Input value={form.events} onChange={e => setForm(f => ({ ...f, events: e.target.value }))} placeholder="schema.drift, quality.failed" className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">URL *</Label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://n8n.example.com/webhook/wowdb" className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Secret (HMAC-SHA256 for X-WowDB-Signature)</Label>
              <Input type="password" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} placeholder="optional" />
            </div>
          </div>
          <Button onClick={submit} disabled={busy} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Create webhook
          </Button>
        </CardContent>
      </Card>

      {hooks.length === 0 ? (
        <EmptyState title="No webhooks yet" description="Webhooks fire when events happen: schema.drift, quality.failed, scheduled.success/failed, test.ping." />
      ) : (
        <div className="space-y-2">
          {hooks.map(h => (
            <Card key={h.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <WebhookIcon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{h.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{h.url}</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">{h.events}</Badge>
                <Button size="sm" variant="ghost" onClick={() => test(h.id)} className="h-7 gap-1 text-xs"><Send className="h-3 w-3" /> Test</Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => del(h.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Scheduled ────────────────────────────────────────────────────────

function ScheduledTab({ connections }: { connections: Connection[] }) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [form, setForm] = useState({
    name: "", cron: "0 6 * * *", task_type: "query" as ScheduledTask["task_type"],
    connection_id: 0, database: "", query_text: "",
  });
  const [busy, setBusy] = useState(false);

  const load = () => api.listScheduledTasks().then(setTasks).catch(() => null);
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.cron.trim()) return;
    setBusy(true);
    try {
      await api.createScheduledTask({
        name: form.name, cron: form.cron, task_type: form.task_type,
        connection_id: form.connection_id || undefined,
        database: form.database || undefined,
        query_text: form.query_text || undefined,
      });
      setForm({ name: "", cron: "0 6 * * *", task_type: "query", connection_id: 0, database: "", query_text: "" });
      load();
    } finally { setBusy(false); }
  };

  const run = async (id: number) => { await api.runScheduledTask(id); setTimeout(load, 500); };
  const del = async (id: number) => { if (confirm("Delete?")) { await api.deleteScheduledTask(id); load(); } };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Daily snapshot" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cron (UTC) *</Label>
              <Input value={form.cron} onChange={e => setForm(f => ({ ...f, cron: e.target.value }))} placeholder="0 6 * * *" className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value as ScheduledTask["task_type"] }))}>
                <option value="query">Run query</option>
                <option value="snapshot">Take schema snapshot</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Connection</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.connection_id} onChange={e => setForm(f => ({ ...f, connection_id: Number(e.target.value) }))}>
                <option value={0}>None</option>
                {connections.map(c => <option key={c.id} value={c.id}>{c.name} ({c.db_type})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Database</Label>
              <Input value={form.database} onChange={e => setForm(f => ({ ...f, database: e.target.value }))} placeholder="creditdb" />
            </div>
            {form.task_type === "query" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Query (read-only)</Label>
                <textarea className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono min-h-[60px]" value={form.query_text} onChange={e => setForm(f => ({ ...f, query_text: e.target.value }))} placeholder="SELECT COUNT(*) FROM contratos" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">Cron format: <code className="font-mono">minute hour day month weekday</code>. Examples: <code className="font-mono">0 6 * * *</code> = daily 6am UTC · <code className="font-mono">*/15 * * * *</code> = every 15min.</p>
          <Button onClick={submit} disabled={busy} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Schedule task
          </Button>
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <EmptyState title="No scheduled tasks" description="Tasks run automatically based on cron and emit webhook events (scheduled.success / scheduled.failed)." />
      ) : (
        <div className="space-y-2">
          {tasks.map(t => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <Badge variant="secondary" className="text-[10px]">{t.task_type}</Badge>
                    <Badge variant="outline" className="text-[10px] font-mono">{t.cron}</Badge>
                    {t.last_status === "success" && <Badge variant="success" className="text-[10px]"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> last OK</Badge>}
                    {t.last_status === "error" && <Badge variant="destructive" className="text-[10px]"><XCircle className="h-2.5 w-2.5 mr-0.5" /> last failed</Badge>}
                  </div>
                  {t.last_run_at && <p className="text-[10px] text-muted-foreground">Last run: {new Date(t.last_run_at).toLocaleString()} {t.last_error ? `· ${t.last_error}` : ""}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => run(t.id)} className="h-7 gap-1 text-xs"><Play className="h-3 w-3" /> Run now</Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => del(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Snapshots ────────────────────────────────────────────────────────

function SnapshotsTab({ connections }: { connections: Connection[] }) {
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [filterConn, setFilterConn] = useState(0);
  const [filterDb, setFilterDb] = useState("");
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [diff, setDiff] = useState<Awaited<ReturnType<typeof api.diffSnapshots>> | null>(null);

  const load = () => api.listSnapshots(filterConn || undefined, filterDb || undefined).then(setSnaps).catch(() => null);
  useEffect(() => { load(); }, [filterConn, filterDb]);

  const compare = async (a: number, b: number) => {
    setSelected([a, b]);
    setDiff(await api.diffSnapshots(a, b));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5">
            <Label className="text-xs">Connection</Label>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filterConn} onChange={e => setFilterConn(Number(e.target.value))}>
              <option value={0}>All</option>
              {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Database</Label>
            <Input className="h-9" value={filterDb} onChange={e => setFilterDb(e.target.value)} placeholder="(any)" />
          </div>
          <p className="text-xs text-muted-foreground ml-auto">Create snapshots from the connection page or via scheduled tasks.</p>
        </CardContent>
      </Card>

      {snaps.length === 0 ? (
        <EmptyState title="No snapshots" description="Snapshots capture your schema state. Webhook schema.drift fires when a new snapshot differs from the previous." />
      ) : (
        <>
          <div className="space-y-2">
            {snaps.map(s => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Camera className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">#{s.id} · <span className="font-mono text-xs">{s.database}</span></p>
                    <p className="text-[10px] text-muted-foreground">{new Date(s.captured_at).toLocaleString()} · {s.table_count} tables · {s.column_count} columns</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected?.includes(s.id) ?? false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const cur = selected ?? [0, 0];
                        const next: [number, number] = cur[0] === 0 ? [s.id, cur[1]] : [cur[0], s.id];
                        setSelected(next);
                        if (next[0] && next[1]) compare(next[0], next[1]);
                      } else {
                        setSelected(null); setDiff(null);
                      }
                    }}
                    className="h-4 w-4"
                    title="Pick 2 snapshots to diff"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {diff && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Diff #{selected![0]} vs #{selected![1]}</span>
                </div>
                {[
                  ["tables_added", "Added tables", "text-emerald-600"],
                  ["tables_removed", "Removed tables", "text-rose-600"],
                ].map(([k, label, cls]) => (
                  (diff[k as "tables_added"] as string[]).length > 0 && (
                    <div key={k as string}>
                      <p className={`text-xs font-medium ${cls}`}>{label}</p>
                      <p className="text-xs font-mono text-muted-foreground">{(diff[k as "tables_added"] as string[]).join(", ")}</p>
                    </div>
                  )
                ))}
                {diff.columns_added.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-600">Added columns</p>
                    <ul className="text-xs font-mono text-muted-foreground list-disc list-inside">
                      {diff.columns_added.map((c, i) => <li key={i}>{c.table}.{c.column} ({c.type})</li>)}
                    </ul>
                  </div>
                )}
                {diff.columns_removed.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-rose-600">Removed columns</p>
                    <ul className="text-xs font-mono text-muted-foreground list-disc list-inside">
                      {diff.columns_removed.map((c, i) => <li key={i}>{c.table}.{c.column}</li>)}
                    </ul>
                  </div>
                )}
                {diff.columns_changed.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-600">Changed columns</p>
                    <ul className="text-xs font-mono text-muted-foreground list-disc list-inside">
                      {diff.columns_changed.map((c, i) => <li key={i}>{c.table}.{c.column}</li>)}
                    </ul>
                  </div>
                )}
                {diff.tables_added.length + diff.tables_removed.length + diff.columns_added.length + diff.columns_removed.length + diff.columns_changed.length === 0 && (
                  <p className="text-xs text-muted-foreground">No structural differences.</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Quality ──────────────────────────────────────────────────────────

function QualityTab({ connections }: { connections: Connection[] }) {
  const [monitors, setMonitors] = useState<QualityMonitor[]>([]);
  const [form, setForm] = useState({
    name: "", connection_id: 0, database: "", query_text: "",
    assertion: "count_gt" as QualityAssertion, threshold: "",
  });
  const [busy, setBusy] = useState(false);

  const load = () => api.listQualityMonitors().then(setMonitors).catch(() => null);
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.connection_id || !form.database || !form.query_text) return;
    setBusy(true);
    try {
      await api.createQualityMonitor({
        name: form.name, connection_id: form.connection_id, database: form.database,
        query_text: form.query_text, assertion: form.assertion, threshold: form.threshold || undefined,
      });
      setForm({ name: "", connection_id: 0, database: "", query_text: "", assertion: "count_gt", threshold: "" });
      load();
    } finally { setBusy(false); }
  };

  const run = async (id: number) => {
    const pwd = sessionStorage.getItem(`pwd_${monitors.find(m => m.id === id)?.connection_id}`) ?? "";
    try {
      const r = await api.checkQualityMonitor(id, pwd);
      alert(`${r.passed ? "✓ PASSED" : "✗ FAILED"}\n${r.message}`);
      load();
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  };

  const del = async (id: number) => { if (confirm("Delete?")) { await api.deleteQualityMonitor(id); load(); } };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="contratos must exist" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Connection *</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.connection_id} onChange={e => setForm(f => ({ ...f, connection_id: Number(e.target.value) }))}>
                <option value={0}>Select…</option>
                {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Database *</Label>
              <Input value={form.database} onChange={e => setForm(f => ({ ...f, database: e.target.value }))} placeholder="creditdb" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assertion</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.assertion} onChange={e => setForm(f => ({ ...f, assertion: e.target.value as QualityAssertion }))}>
                <option value="count_gt">Row count &gt; threshold</option>
                <option value="count_eq">Row count = threshold</option>
                <option value="count_lt">Row count &lt; threshold</option>
                <option value="no_nulls">No nulls in column (threshold = column name)</option>
                <option value="value_min">First value &gt;= threshold</option>
                <option value="value_max">First value &lt;= threshold</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Query (read-only) *</Label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono min-h-[60px]" value={form.query_text} onChange={e => setForm(f => ({ ...f, query_text: e.target.value }))} placeholder="SELECT * FROM contratos WHERE valor IS NULL" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Threshold</Label>
              <Input value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} placeholder="0 (or column name for no_nulls)" />
            </div>
          </div>
          <Button onClick={submit} disabled={busy} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add monitor
          </Button>
        </CardContent>
      </Card>

      {monitors.length === 0 ? (
        <EmptyState title="No quality monitors" description="Monitors check assertions on query results. When they fail, webhook quality.failed fires." />
      ) : (
        <div className="space-y-2">
          {monitors.map(m => (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{m.name}</p>
                    <Badge variant="outline" className="text-[10px] font-mono">{m.assertion}</Badge>
                    {m.threshold && <Badge variant="secondary" className="text-[10px] font-mono">{m.threshold}</Badge>}
                    {m.last_passed === true && <Badge variant="success" className="text-[10px]"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> passed</Badge>}
                    {m.last_passed === false && <Badge variant="destructive" className="text-[10px]"><AlertCircle className="h-2.5 w-2.5 mr-0.5" /> failed</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{m.query_text}</p>
                  {m.last_check_at && <p className="text-[10px] text-muted-foreground">Last: {new Date(m.last_check_at).toLocaleString()} · value={m.last_value}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => run(m.id)} className="h-7 gap-1 text-xs"><Play className="h-3 w-3" /> Check</Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => del(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
