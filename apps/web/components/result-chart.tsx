"use client";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend,
} from "recharts";
import { BarChart3, LineChart as LineIcon, AreaChart as AreaIcon, PieChart as PieIcon } from "lucide-react";

interface Props {
  columns: string[];
  rows: Record<string, unknown>[];
}

type ChartKind = "bar" | "line" | "area" | "pie";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

function isNumeric(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim() !== "" && !isNaN(Number(value));
  return false;
}

export function ResultChart({ columns, rows }: Props) {
  const [kind, setKind] = useState<ChartKind>("bar");

  const { labelCol, numericCols } = useMemo(() => {
    if (columns.length < 2 || rows.length === 0) return { labelCol: null, numericCols: [] as string[] };
    // Find first non-numeric column as label, rest numeric
    let lc: string | null = null;
    const nc: string[] = [];
    for (const c of columns) {
      const sample = rows.slice(0, 5).map(r => r[c]);
      const allNum = sample.every(isNumeric);
      if (!lc && !allNum) {
        lc = c;
      } else if (allNum) {
        nc.push(c);
      }
    }
    // Fallback: first col as label even if numeric
    if (!lc && columns.length > 0) {
      lc = columns[0];
      for (const c of columns.slice(1)) {
        const sample = rows.slice(0, 5).map(r => r[c]);
        if (sample.every(isNumeric)) nc.push(c);
      }
    }
    return { labelCol: lc, numericCols: nc };
  }, [columns, rows]);

  const data = useMemo(() => {
    if (!labelCol) return [];
    return rows.slice(0, 100).map(r => {
      const row: Record<string, unknown> = { [labelCol]: String(r[labelCol] ?? "") };
      for (const nc of numericCols) {
        row[nc] = Number(r[nc] ?? 0);
      }
      return row;
    });
  }, [rows, labelCol, numericCols]);

  if (!labelCol || numericCols.length === 0 || data.length === 0) {
    return (
      <div className="rounded-md border bg-card/40 p-8 text-center text-xs text-muted-foreground">
        Chart unavailable — need at least one categorical column and one numeric column.
      </div>
    );
  }

  const chartButtons: { kind: ChartKind; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { kind: "bar", icon: BarChart3, label: "Bar" },
    { kind: "line", icon: LineIcon, label: "Line" },
    { kind: "area", icon: AreaIcon, label: "Area" },
    { kind: "pie", icon: PieIcon, label: "Pie" },
  ];

  return (
    <div className="rounded-md border bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-muted-foreground">
          {data.length} points · X: <span className="font-mono">{labelCol}</span> · Y: <span className="font-mono">{numericCols.join(", ")}</span>
        </div>
        <div className="flex items-center gap-1">
          {chartButtons.map(({ kind: k, icon: Icon, label }) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              title={label}
              className={`rounded-md border p-1.5 transition-colors ${
                kind === k ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        {kind === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={labelCol} fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {numericCols.map((nc, i) => (
              <Bar key={nc} dataKey={nc} fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        ) : kind === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={labelCol} fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {numericCols.map((nc, i) => (
              <Line key={nc} type="monotone" dataKey={nc} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
            ))}
          </LineChart>
        ) : kind === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={labelCol} fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {numericCols.map((nc, i) => (
              <Area key={nc} type="monotone" dataKey={nc} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.3} />
            ))}
          </AreaChart>
        ) : (
          <PieChart>
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Pie
              data={data}
              dataKey={numericCols[0]}
              nameKey={labelCol}
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
