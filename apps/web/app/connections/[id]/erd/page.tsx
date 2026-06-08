"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitFork } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { ErdCanvas } from "@/components/erd/erd-canvas";
import { api } from "@/lib/api";
import type { ErdData } from "@/lib/types";

export default function ErdPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const connId = Number(id);
  const database = searchParams.get("database") ?? "";

  const password =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`pwd_${connId}`) ?? ""
      : "";

  const [data, setData] = useState<ErdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!database || !password) {
      setError("Missing database or session. Go back and reconnect.");
      setLoading(false);
      return;
    }
    api
      .getErd(connId, database, password)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [connId, database, password]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader
        title={`ERD — ${database}`}
        description="Entity Relationship Diagram · double-click a table to explore"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/connections/${connId}`}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
            </Link>
          </Button>
        }
      />

      <div className="flex-1 overflow-hidden">
        {loading && <LoadingState message="Building ERD…" />}
        {error && <ErrorState message={error} />}
        {data && data.nodes.length === 0 && (
          <ErrorState title="No tables found" message="The selected database has no tables to diagram." />
        )}
        {data && data.nodes.length > 0 && (
          <ErdCanvas data={data} connectionId={connId} database={database} />
        )}
      </div>
    </div>
  );
}
