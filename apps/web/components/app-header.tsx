"use client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface AppHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, description, actions }: AppHeaderProps) {
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    api.health()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold truncate">{title}</h1>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {apiOk !== null && (
          <Badge variant={apiOk ? "success" : "destructive"} className="text-[10px]">
            API {apiOk ? "online" : "offline"}
          </Badge>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
