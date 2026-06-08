"use client";
import { useState } from "react";
import { Play, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SqlEditorProps {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  loading?: boolean;
  className?: string;
}

export function SqlEditor({ value, onChange, onRun, loading, className }: SqlEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">SQL Editor</span>
          <Badge variant="warning" className="gap-1 text-[10px]">
            <Lock className="h-2.5 w-2.5" />
            Read-only mode
          </Badge>
        </div>
        <Button size="sm" onClick={onRun} disabled={loading || !value.trim()}>
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {loading ? "Running..." : "Run"}
          <span className="ml-2 text-[10px] text-primary-foreground/60">⌘↵</span>
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="SELECT * FROM clientes LIMIT 20;"
        className="min-h-[140px] font-mono text-sm resize-none"
        spellCheck={false}
      />
    </div>
  );
}
