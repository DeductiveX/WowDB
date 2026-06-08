"use client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIResultPanel } from "./ai-result-panel";
import { getAISettings } from "@/lib/ai";
import { useStream } from "@/lib/use-stream";
import { PROMPTS, serializeSchema } from "@/lib/ai-prompts";
import { AIProviderDialog } from "./ai-provider-dialog";
import type { SchemaContext } from "@/lib/types";

interface Props {
  tableName: string;
  schemaCtx: SchemaContext | null;
}

export function SchemaReviewer({ tableName, schemaCtx }: Props) {
  const { text, streaming, error, run, stop, reset } = useStream();
  const [hasRun, setHasRun] = useState(false);

  const handleAnalyze = async () => {
    const settings = getAISettings();
    if (!settings || !schemaCtx) return;

    reset();
    setHasRun(true);

    const schemaText = serializeSchema(schemaCtx);
    const table = schemaCtx.tables.find((t) => t.name === tableName);
    const tableDesc = table
      ? `Table to review: ${tableName}\n\n` + serializeSchema({ database: schemaCtx.database, tables: [table] })
      : `Table to review: ${tableName}`;

    await run(
      [
        { role: "system", content: PROMPTS.reviewTable(schemaText) },
        { role: "user", content: tableDesc },
      ],
      settings
    );
  };

  const noSettings = !getAISettings();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          AI will analyze this table&apos;s schema and suggest improvements.
        </p>
        {noSettings ? (
          <AIProviderDialog>
            <Button size="sm" variant="outline">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Configure AI
            </Button>
          </AIProviderDialog>
        ) : (
          <Button size="sm" onClick={handleAnalyze} disabled={streaming || !schemaCtx}>
            {streaming ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            {hasRun && !streaming ? "Re-analyze" : "Analyze Table"}
          </Button>
        )}
      </div>

      {hasRun && (
        <AIResultPanel
          title={`Analysis — ${tableName}`}
          text={text}
          streaming={streaming}
          error={error}
          onStop={stop}
          onClose={reset}
        />
      )}
    </div>
  );
}
