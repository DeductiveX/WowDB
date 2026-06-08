import { Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
        {icon ?? <Database className="h-8 w-8" />}
      </div>
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      {description && <p className="mb-4 text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
