"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { ErdCanvas } from "@/components/erd/erd-canvas";
import { api } from "@/lib/api";
import type { ErdData } from "@/lib/types";

function ErdContent({ connId }: { connId: number }) {
  const searchParams = useSearchParams();
  const database = searchParams.get("database") ?? "";

  const [password, setPassword] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem(`pwd_${connId}`) ?? ""
      : ""
  );
  const [pendingPassword, setPendingPassword] = useState("");

  const [data, setData] = useState<ErdData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchErd = (pwd: string) => {
    if (!database || !pwd) return;
    setLoading(true);
    setError(null);
    api
      .getErd(connId, database, pwd)
      .then((d) => {
        setData(d);
        sessionStorage.setItem(`pwd_${connId}`, pwd);
        setPassword(pwd);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (password) fetchErd(password);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const header = (
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
  );

  // No session — show inline password prompt
  if (!password && !loading && !data) {
    return (
      <>
        {header}
        <div className="flex flex-col flex-1 items-center justify-center p-6">
          <Card className="max-w-sm w-full">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" /> Session expired
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Enter your database password to load the ERD for{" "}
                <span className="font-mono font-medium">{database}</span>.
              </p>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={pendingPassword}
                  onChange={(e) => setPendingPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchErd(pendingPassword)}
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button
                onClick={() => fetchErd(pendingPassword)}
                disabled={loading || !pendingPassword}
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Load ERD
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
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
    </>
  );
}

export default function ErdPage() {
  const { id } = useParams<{ id: string }>();
  const connId = Number(id);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Suspense fallback={<LoadingState message="Building ERD…" />}>
        <ErdContent connId={connId} />
      </Suspense>
    </div>
  );
}
