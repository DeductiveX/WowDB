"use client";
import { useState, useEffect } from "react";
import { Sparkles, KeyRound, Trash2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAISettings,
  saveAISettings,
  clearAISettings,
  PROVIDER_DEFAULTS,
} from "@/lib/ai";
import type { AIProvider, AISettings } from "@/lib/ai";

interface Props {
  children?: React.ReactNode;
  onSave?: (settings: AISettings) => void;
}

export function AIProviderDialog({ children, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(PROVIDER_DEFAULTS.openai.model);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      const s = getAISettings();
      if (s) {
        setProvider(s.provider);
        setApiKey(s.apiKey);
        setModel(s.model);
      }
    }
  }, [open]);

  const handleProviderChange = (p: AIProvider) => {
    setProvider(p);
    setModel(PROVIDER_DEFAULTS[p].model);
  };

  const handleSave = () => {
    const s: AISettings = { provider, apiKey: apiKey.trim(), model: model.trim() };
    saveAISettings(s);
    setSaved(true);
    onSave?.(s);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 800);
  };

  const handleClear = () => {
    clearAISettings();
    setApiKey("");
    setModel(PROVIDER_DEFAULTS[provider].model);
  };

  const isConfigured = !!getAISettings();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isConfigured ? "AI ✓" : "AI Setup"}</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Configuration
          </DialogTitle>
          <DialogDescription>
            Your API key stays in this browser session only — never sent to WowDB servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Provider</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_DEFAULTS) as AIProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    provider === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  {PROVIDER_DEFAULTS[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <KeyRound className="h-3 w-3" /> API Key
            </Label>
            <Input
              type="password"
              placeholder={PROVIDER_DEFAULTS[provider].placeholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Model</Label>
            <Input
              placeholder={PROVIDER_DEFAULTS[provider].model}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={!apiKey.trim() || !model.trim()} className="flex-1">
              {saved ? (
                <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Saved!</>
              ) : (
                "Save"
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={handleClear} title="Clear settings">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
