import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", message, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-3 text-center", className)}>
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{message}</p>
      </div>
    </div>
  );
}
