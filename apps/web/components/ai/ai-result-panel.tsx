"use client";
import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreamingMessage } from "./streaming-message";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  text: string;
  streaming: boolean;
  error: string | null;
  onStop?: () => void;
  onClose?: () => void;
  mono?: boolean;
  className?: string;
}

export function AIResultPanel({ title, text, streaming, error, onStop, onClose, mono, className }: Props) {
  if (!text && !streaming && !error) return null;

  return (
    <div className={cn("rounded-lg border bg-muted/20 overflow-hidden", className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="flex items-center gap-1.5">
          {streaming && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onStop}>
              <Square className="h-3 w-3 fill-current" />
            </Button>
          )}
          {!streaming && onClose && (
            <button
              onClick={onClose}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="p-3">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <StreamingMessage text={text} streaming={streaming} mono={mono} />
        )}
      </div>
    </div>
  );
}
