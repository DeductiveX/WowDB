import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "ok" | "error" | "warning" | "offline" | "readonly";
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const map = {
    ok: { variant: "success" as const, text: label ?? "Online" },
    error: { variant: "destructive" as const, text: label ?? "Error" },
    warning: { variant: "warning" as const, text: label ?? "Warning" },
    offline: { variant: "secondary" as const, text: label ?? "Offline" },
    readonly: { variant: "warning" as const, text: label ?? "Read-only" },
  };
  const { variant, text } = map[status];
  return <Badge variant={variant} className={cn("gap-1", className)}>{text}</Badge>;
}
