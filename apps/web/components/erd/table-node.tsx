"use client";
import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { ErdColumn } from "@/lib/types";

interface TableNodeData {
  table_name: string;
  engine: string;
  comment: string;
  row_count: number | null;
  columns: ErdColumn[];
}

const keyColor: Record<string, string> = {
  PRI: "text-amber-500",
  UNI: "text-blue-500",
  MUL: "text-purple-400",
};

function TableNode({ data, selected }: NodeProps<TableNodeData>) {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-md min-w-[220px] max-w-[280px] text-xs transition-shadow ${
        selected ? "border-primary shadow-primary/20 shadow-lg" : "border-border"
      }`}
    >
      {/* Header */}
      <div className="rounded-t-lg bg-primary/10 border-b border-border px-3 py-2">
        <div className="font-mono font-semibold text-sm truncate">{data.table_name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{data.engine}</span>
          {data.row_count !== null && (
            <span className="text-[10px] text-muted-foreground">· ~{data.row_count} rows</span>
          )}
        </div>
      </div>

      {/* Columns */}
      <div className="divide-y divide-border/50">
        {data.columns.map((col) => (
          <div key={col.name} className="relative flex items-center gap-2 px-3 py-1.5 group">
            {/* Left handle (target) on each column row */}
            <Handle
              type="target"
              position={Position.Left}
              id={col.name}
              className="!w-2 !h-2 !border !border-border !bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: -5 }}
            />

            {/* Key indicator */}
            <span className={`w-3 shrink-0 font-bold ${keyColor[col.key] ?? "text-transparent"}`}>
              {col.key === "PRI" ? "🔑" : col.key === "UNI" ? "U" : col.key === "MUL" ? "I" : "·"}
            </span>

            <span className="font-mono truncate flex-1 text-[11px]">{col.name}</span>
            <span className="text-muted-foreground text-[10px] shrink-0 truncate max-w-[80px]">{col.type}</span>

            {/* Right handle (source) on each column row */}
            <Handle
              type="source"
              position={Position.Right}
              id={col.name}
              className="!w-2 !h-2 !border !border-border !bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ right: -5 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(TableNode);
