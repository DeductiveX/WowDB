"use client";
import { cn } from "@/lib/utils";

interface DataTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
  className?: string;
}

export function DataTable({ columns, rows, className }: DataTableProps) {
  if (columns.length === 0) return null;

  return (
    <div className={cn("w-full overflow-auto rounded-md border", className)}>
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t hover:bg-muted/25 transition-colors">
              {columns.map((col) => {
                const val = row[col];
                const display = val === null ? <span className="text-muted-foreground/50 italic">NULL</span> : String(val);
                return (
                  <td key={col} className="whitespace-nowrap px-3 py-2 font-mono text-xs max-w-[280px] truncate">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">No rows returned.</div>
      )}
    </div>
  );
}
