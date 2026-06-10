import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Connection } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Human-readable target for a Connection (handles SQLite vs network DBs). */
export function connectionLabel(conn: Pick<Connection, "db_type" | "host" | "port" | "user" | "db_path">): string {
  if (conn.db_type === "sqlite") return conn.db_path ?? "sqlite://";
  const user = conn.user ?? "?";
  const host = conn.host ?? "?";
  const port = conn.port ?? "?";
  return `${user}@${host}:${port}`;
}
