"use client";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  streaming?: boolean;
  className?: string;
  mono?: boolean;
}

export function StreamingMessage({ text, streaming, className, mono }: Props) {
  return (
    <div
      className={cn(
        "text-sm leading-relaxed whitespace-pre-wrap break-words",
        mono && "font-mono text-xs",
        className
      )}
    >
      {text}
      {streaming && (
        <span className="inline-block w-0.5 h-[1em] ml-0.5 bg-current align-middle animate-pulse" />
      )}
    </div>
  );
}
