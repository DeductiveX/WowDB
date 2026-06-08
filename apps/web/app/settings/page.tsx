"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Sparkles, KeyRound, Trash2, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAISettings, saveAISettings, clearAISettings,
  PROVIDER_DEFAULTS,
} from "@/lib/ai";
import type { AIProvider, AISettings } from "@/lib/ai";

const themes = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [provider, setProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(PROVIDER_DEFAULTS.openai.model);
  const [saved, setSaved] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const s = getAISettings();
    if (s) {
      setProvider(s.provider);
      setApiKey(s.apiKey);
      setModel(s.model);
      setIsConfigured(true);
    }
  }, []);

  const handleProviderChange = (p: AIProvider) => {
    setProvider(p);
    setModel(PROVIDER_DEFAULTS[p].model);
  };

  const handleSave = () => {
    const s: AISettings = { provider, apiKey: apiKey.trim(), model: model.trim() };
    saveAISettings(s);
    setIsConfigured(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleClear = () => {
    clearAISettings();
    setApiKey("");
    setModel(PROVIDER_DEFAULTS[provider].model);
    setIsConfigured(false);
  };

  return (
    <div className="flex flex-col">
      <AppHeader title="Settings" description="Preferences and configuration" />

      <div className="p-6 max-w-2xl space-y-6">
        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Appearance</CardTitle>
            <CardDescription>Choose your preferred color theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {themes.map(({ id, label, icon: Icon }) => (
                <Button key={id} variant={theme === id ? "default" : "outline"} size="sm" onClick={() => setTheme(id)} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Provider
              {isConfigured && <Badge variant="success" className="text-[10px]">Configured</Badge>}
            </CardTitle>
            <CardDescription>
              Your API key is stored in browser session only — never sent to WowDB servers. It resets when you close the browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <p className="text-[11px] text-muted-foreground">
                Default: <span className="font-mono">{PROVIDER_DEFAULTS[provider].model}</span>
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={!apiKey.trim() || !model.trim()} className="flex-1">
                {saved ? <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Saved!</> : "Save for this session"}
              </Button>
              {isConfigured && (
                <Button variant="outline" size="icon" onClick={handleClear} title="Clear AI settings">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="rounded-md bg-muted/40 p-3 space-y-1 text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground">Available features with AI configured:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>NL → SQL: describe queries in plain language in the editor</li>
                <li>Explain: understand any query step by step</li>
                <li>Optimize: get index and rewrite suggestions</li>
                <li>AI Chat: ask questions about your schema</li>
                <li>Table Analysis: per-table architecture review</li>
                <li>AI Docs: richer schema documentation with descriptions</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Version info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Version</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>WowDB</span>
              <Badge variant="secondary">v0.2.0</Badge>
            </div>
            <div className="flex justify-between">
              <span>Query limit (default)</span>
              <Badge variant="outline">100 rows</Badge>
            </div>
            <div className="flex justify-between">
              <span>Query timeout</span>
              <Badge variant="outline">10s</Badge>
            </div>
            <div className="flex justify-between">
              <span>Password storage</span>
              <Badge variant="warning">Session only</Badge>
            </div>
            <div className="flex justify-between">
              <span>AI key storage</span>
              <Badge variant="warning">Session only</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
