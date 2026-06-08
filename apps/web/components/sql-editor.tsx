"use client";
import { useState } from "react";
import { Play, Lock, Lightbulb, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAISettings } from "@/lib/ai";

interface SqlEditorProps {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  onExplain?: () => void;
  onOptimize?: () => void;
  loading?: boolean;
  className?: string;
}

export function SqlEditor({ value, onChange, onRun, onExplain, onOptimize, loading, className }: SqlEditorProps) {
  const [rows, setRows] = useState(6);
  const aiConfigured = !!getAISettings();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "e") {
      e.preventDefault();
      onExplain?.();
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">SQL Editor</span>
          <Badge variant="warning" className="gap-1 text-[10px]">
            <Lock className="h-2.5 w-2.5" />
            Read-only
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {onExplain && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onExplain}
              disabled={!value.trim() || !aiConfigured}
              title={aiConfigured ? "Explain query (⌘E)" : "Configure AI first"}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground"
            >
              <Lightbulb className="h-3 w-3" />
              Explain
            </Button>
          )}
          {onOptimize && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onOptimize}
              disabled={!value.trim() || !aiConfigured}
              title={aiConfigured ? "Optimize query" : "Configure AI first"}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground"
            >
              <Zap className="h-3 w-3" />
              Optimize
            </Button>
          )}
          <Button size="sm" onClick={onRun} disabled={loading || !value.trim()}>
            <Play className="mr-1.5 h-3.5 w-3.5" />
            {loading ? "Running…" : "Run"}
            <span className="ml-2 text-[10px] text-primary-foreground/60">⌘↵</span>
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="SELECT * FROM clientes LIMIT 20;"
        className="font-mono text-sm resize-none"
        style={{ minHeight: `${rows * 1.5}rem` }}
        rows={rows}
        spellCheck={false}
        onFocus={() => setRows(8)}
        onBlur={() => !value && setRows(6)}
      />
    </div>
  );
}
