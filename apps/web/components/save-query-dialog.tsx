"use client";
import { useState } from "react";
import { Bookmark, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  query: string;
  connectionId: number | null;
  database: string | null;
}

export function SaveQueryDialog({ open, onClose, query, connectionId, database }: Props) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.createSavedQuery({
        name: name.trim(),
        query_text: query,
        tags: tags.trim() || undefined,
        description: description.trim() || undefined,
        connection_id: connectionId ?? undefined,
        database: database ?? undefined,
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setName("");
        setTags("");
        setDescription("");
        onClose();
      }, 1100);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-popover shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Save Query</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Daily contracts report"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tags (comma-separated)</Label>
            <Input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="reports, daily, credit"
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Top 10 active contracts"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Preview</Label>
            <pre className="text-[10px] font-mono bg-muted/40 rounded p-2.5 overflow-auto whitespace-pre-wrap break-all max-h-32">
              {query || "(empty)"}
            </pre>
            <p className="text-[10px] text-muted-foreground">
              Tip: use <code className="font-mono">:param_name</code> for runtime parameters.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving} className="gap-1.5">
              {saved ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</> : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
