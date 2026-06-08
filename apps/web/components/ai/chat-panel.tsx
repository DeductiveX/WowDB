"use client";
import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreamingMessage } from "./streaming-message";
import { AIProviderDialog } from "./ai-provider-dialog";
import { getAISettings } from "@/lib/ai";
import { useStream } from "@/lib/use-stream";
import { PROMPTS, serializeSchema } from "@/lib/ai-prompts";
import type { AIMessage } from "@/lib/ai";
import type { SchemaContext } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  schemaCtx: SchemaContext | null;
  database: string;
}

export function ChatPanel({ open, onClose, schemaCtx, database }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { text, streaming, error, run, stop } = useStream();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, text]);

  const handleSend = async () => {
    const settings = getAISettings();
    if (!settings || !input.trim() || streaming) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);

    const schemaText = schemaCtx ? serializeSchema(schemaCtx) : `Database: ${database}`;
    const systemContent = PROMPTS.chat(schemaText);

    const aiMessages: AIMessage[] = [
      { role: "system", content: systemContent },
      ...newMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    await run(aiMessages, settings, (full) => {
      setMessages((prev) => [...prev, { role: "assistant", content: full }]);
    });
  };

  const noSettings = !getAISettings();

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-screen w-96 border-l bg-background z-50 flex flex-col shadow-xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI Chat</span>
          {database && (
            <span className="text-[10px] text-muted-foreground font-mono">{database}</span>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="text-center py-8 space-y-2">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {noSettings
                ? "Configure your AI provider to start chatting."
                : schemaCtx
                ? `Ask anything about ${database}. The full schema is loaded as context.`
                : "Select a database first to load schema context."}
            </p>
            {noSettings && (
              <AIProviderDialog>
                <Button size="sm" variant="outline" className="mx-auto">
                  Configure AI
                </Button>
              </AIProviderDialog>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg p-3 text-sm",
              m.role === "user"
                ? "bg-primary/10 ml-6"
                : "bg-muted/50 mr-6"
            )}
          >
            <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase">
              {m.role === "user" ? "You" : "AI"}
            </p>
            <StreamingMessage text={m.content} />
          </div>
        ))}

        {streaming && (
          <div className="bg-muted/50 rounded-lg p-3 mr-6">
            <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase">AI</p>
            <StreamingMessage text={text} streaming />
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 shrink-0">
        {streaming && (
          <div className="flex justify-end mb-2">
            <Button size="sm" variant="ghost" onClick={stop} className="h-6 text-[11px]">
              Stop
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            placeholder={noSettings ? "Configure AI first…" : "Ask about your schema…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={noSettings || streaming}
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || streaming || noSettings}>
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
