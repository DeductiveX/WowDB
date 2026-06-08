"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Copy, CheckCheck, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { api } from "@/lib/api";

export default function DocsPage() {
  const { connection } = useParams<{ connection: string }>();
  const searchParams = useSearchParams();
  const connId = Number(connection);
  const database = searchParams.get("db") ?? "";
  const pwdParam = searchParams.get("pwd") ?? "";

  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const password = pwdParam || (typeof window !== "undefined" ? sessionStorage.getItem(`pwd_${connId}`) ?? "" : "");

  useEffect(() => {
    if (!database || !password) {
      setError("Missing database or password. Go back to the connection explorer.");
      setLoading(false);
      return;
    }
    api.generateDocs(connId, database, password)
      .then((r) => setMarkdown(r.markdown))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [connId, database, password]);

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Schema Documentation"
        description={database ? `${database} · Markdown` : ""}
        actions={
          markdown && (
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Markdown"}
            </Button>
          )
        }
      />

      <div className="p-6">
        {loading && <LoadingState message="Generating documentation..." />}
        {error && <ErrorState message={error} />}
        {markdown && (
          <pre className="w-full overflow-auto rounded-lg border bg-muted/30 p-6 text-xs font-mono leading-relaxed whitespace-pre-wrap">
            {markdown}
          </pre>
        )}
      </div>
    </div>
  );
}
