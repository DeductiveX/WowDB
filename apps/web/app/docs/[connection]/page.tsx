"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Copy, CheckCheck, Sparkles, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { api } from "@/lib/api";
import { getAISettings } from "@/lib/ai";
import { useStream } from "@/lib/use-stream";
import { PROMPTS, serializeSchema } from "@/lib/ai-prompts";

function DocsContent({ connId }: { connId: number }) {
  const searchParams = useSearchParams();
  const database = searchParams.get("db") ?? "";

  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiMode, setAiMode] = useState(false);

  const aiStream = useStream();

  const password =
    typeof window !== "undefined" ? sessionStorage.getItem(`pwd_${connId}`) ?? "" : "";

  useEffect(() => {
    if (!database || !password) {
      setError("Missing database or password. Go back to the connection explorer.");
      setLoading(false);
      return;
    }
    api
      .generateDocs(connId, database, password)
      .then((r) => setMarkdown(r.markdown))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [connId, database, password]);

  const handleGenerateWithAI = async () => {
    const settings = getAISettings();
    if (!settings || !database || !password) return;
    setAiMode(true);
    aiStream.reset();
    try {
      const ctx = await api.getAIContext(connId, database, password);
      const schemaText = serializeSchema(ctx);
      await aiStream.run(
        [
          { role: "system", content: PROMPTS.generateDocs(schemaText) },
          { role: "user", content: `Generate complete documentation for the "${database}" database.` },
        ],
        settings
      );
    } catch (e) {
      setAiMode(false);
    }
  };

  const displayContent = aiMode ? aiStream.text : markdown;
  const isStreaming = aiMode && aiStream.streaming;

  const handleCopy = () => {
    if (!displayContent) return;
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const aiConfigured = !!getAISettings();

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Schema Documentation"
        description={database ? `${database} · Markdown` : ""}
        actions={
          <div className="flex items-center gap-2">
            {aiConfigured && !isStreaming && (
              <Button
                variant="outline"
                size="sm"
                onClick={aiMode ? () => setAiMode(false) : handleGenerateWithAI}
                disabled={loading}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {aiMode ? "Use Standard" : "Generate with AI"}
              </Button>
            )}
            {isStreaming && (
              <Button variant="outline" size="sm" onClick={aiStream.stop}>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Stop
              </Button>
            )}
            {displayContent && (
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy Markdown"}
              </Button>
            )}
          </div>
        }
      />
      <div className="p-6">
        {loading && <LoadingState message="Generating documentation..." />}
        {error && <ErrorState message={error} />}
        {displayContent && (
          <div className="space-y-2">
            {aiMode && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {isStreaming ? "AI is writing documentation…" : "AI-generated documentation"}
              </p>
            )}
            <pre className="w-full overflow-auto rounded-lg border bg-muted/30 p-6 text-xs font-mono leading-relaxed whitespace-pre-wrap">
              {displayContent}
              {isStreaming && <span className="inline-block w-0.5 h-[1em] ml-0.5 bg-current align-middle animate-pulse" />}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocsPage() {
  const { connection } = useParams<{ connection: string }>();
  return (
    <Suspense fallback={<LoadingState message="Loading docs…" />}>
      <DocsContent connId={Number(connection)} />
    </Suspense>
  );
}
