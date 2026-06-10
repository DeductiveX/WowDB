"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Database, PlugZap, Code2, Settings, ChevronRight, Sparkles, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIProviderDialog } from "@/components/ai/ai-provider-dialog";
import { getAISettings } from "@/lib/ai";

const nav = [
  { href: "/", label: "Dashboard", icon: Database },
  { href: "/connections", label: "Connections", icon: PlugZap },
  { href: "/editor", label: "SQL Editor", icon: Code2 },
  { href: "/history", label: "Query History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [aiConfigured, setAiConfigured] = useState(false);

  useEffect(() => {
    setAiConfigured(!!getAISettings());
  }, []);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
          W
        </div>
        <span className="font-semibold tracking-tight">WowDB</span>
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          v0.3
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="ml-auto h-3 w-3" />}
            </Link>
          );
        })}
      </nav>

      {/* AI Setup footer */}
      <div className="border-t p-3 space-y-2">
        <AIProviderDialog onSave={() => setAiConfigured(true)}>
          <button className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground">
            <Sparkles className={cn("h-3.5 w-3.5 shrink-0", aiConfigured && "text-primary")} />
            <span>{aiConfigured ? "AI configured ✓" : "Setup AI"}</span>
          </button>
        </AIProviderDialog>
        <p className="text-[10px] text-muted-foreground text-center">
          Read-only · MIT License
        </p>
      </div>
    </aside>
  );
}
