"use client";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Sparkles, Bot, BarChart3 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const themes = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const upcoming = [
  { icon: Bot, label: "AI Explain", version: "v0.3", desc: "Natural language schema explanations via Ollama or OpenAI." },
  { icon: BarChart3, label: "ERD View", version: "v0.2", desc: "Visual entity-relationship diagram for your schema." },
  { icon: Sparkles, label: "MCP Server", version: "v0.4", desc: "Expose your database schema to AI agents via MCP." },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col">
      <AppHeader title="Settings" description="Preferences and upcoming features" />

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
                <Button
                  key={id}
                  variant={theme === id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
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
              <Badge variant="secondary">v0.1.0</Badge>
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
              <Badge variant="warning">Memory only</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming features */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming Features</h3>
          <div className="space-y-3">
            {upcoming.map(({ icon: Icon, label, version, desc }) => (
              <Card key={label} className="opacity-60">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="rounded-md bg-muted p-1.5 mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{label}</span>
                      <Badge variant="secondary" className="text-[10px]">{version}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
