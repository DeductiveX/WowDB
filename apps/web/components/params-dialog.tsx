"use client";
import { useState } from "react";
import { X, Play, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
  params: string[];
  onRun: (filled: Record<string, string>) => void;
}

export function ParamsDialog({ open, onClose, params, onRun }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-popover shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Fill query parameters</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="p-4 space-y-3">
          {params.map(p => (
            <div key={p} className="space-y-1.5">
              <Label className="text-xs font-mono">:{p}</Label>
              <Input
                value={values[p] ?? ""}
                onChange={e => setValues(v => ({ ...v, [p]: e.target.value }))}
                placeholder={`Value for :${p}`}
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => { onRun(values); onClose(); }}
              disabled={params.some(p => !values[p]?.trim())}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" /> Run
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
