"use client";
import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAISettings } from "@/lib/ai";
import { useStream } from "@/lib/use-stream";
import { PROMPTS } from "@/lib/ai-prompts";

interface Props {
  schemaText: string;
  onResult: (sql: string) => void;
}

export function NlSqlBar({ schemaText, onResult }: Props) {
  const [prompt, setPrompt] = useState("");
  const { text, streaming, error, run, reset } = useStream();

  const handleGenerate = async () => {
    const settings = getAISettings();
    if (!settings || !prompt.trim()) return;
    reset();
    await run(
      [
        { role: "system", content: PROMPTS.nlToSql(schemaText) },
        { role: "user", content: prompt.trim() },
      ],
      settings,
      (sql) => {
        onResult(sql.trim());
        setPrompt("");
      }
    );
  };

  const noSettings = !getAISettings();

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Wand2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 text-sm h-9"
            placeholder={noSettings ? "Configure AI first (sidebar → AI Setup)" : "Describe what you want to query…"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !streaming && handleGenerate()}
            disabled={noSettings || streaming}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={!prompt.trim() || streaming || noSettings}
          className="shrink-0"
        >
          {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "→ SQL"}
        </Button>
      </div>
      {streaming && text && (
        <p className="text-[11px] text-muted-foreground font-mono truncate px-1">{text}</p>
      )}
      {error && <p className="text-[11px] text-destructive px-1">{error}</p>}
    </div>
  );
}
