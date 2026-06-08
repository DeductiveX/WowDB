"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Key, Link2, FileText } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { api } from "@/lib/api";
import type { TableDetail, PreviewResult } from "@/lib/types";

export default function TableDetailPage() {
  const { id, table } = useParams<{ id: string; table: string }>();
  const searchParams = useSearchParams();
  const database = searchParams.get("database") ?? "";
  const connId = Number(id);

  const [detail, setDetail] = useState<TableDetail | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const password = typeof window !== "undefined" ? sessionStorage.getItem(`pwd_${connId}`) ?? "" : "";

  useEffect(() => {
    if (!password) return;
    setLoadingDetail(true);
    api.describeTable(connId, table, database, password)
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingDetail(false));
  }, [connId, table, database, password]);

  const loadPreview = () => {
    if (!password) return;
    setLoadingPreview(true);
    api.previewTable(connId, table, database, password)
      .then(setPreview)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingPreview(false));
  };

  if (loadingDetail) return <LoadingState message="Loading table details..." />;
  if (error) return <ErrorState message={error} />;
  if (!detail) return null;

  const keyBadge = (key: string) => {
    if (key === "PRI") return <Badge variant="default" className="text-[10px]">PRI</Badge>;
    if (key === "UNI") return <Badge variant="outline" className="text-[10px]">UNI</Badge>;
    if (key === "MUL") return <Badge variant="secondary" className="text-[10px]">MUL</Badge>;
    return <span className="text-muted-foreground">—</span>;
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={table}
        description={`${database} · ${detail.columns.length} columns`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/connections/${connId}?database=${database}`}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
            </Link>
          </Button>
        }
      />

      <div className="p-6">
        <Tabs defaultValue="columns">
          <TabsList className="mb-4">
            <TabsTrigger value="columns">Columns ({detail.columns.length})</TabsTrigger>
            <TabsTrigger value="indexes">Indexes ({detail.indexes.length})</TabsTrigger>
            {detail.foreign_keys.length > 0 && (
              <TabsTrigger value="fk">Foreign Keys ({detail.foreign_keys.length})</TabsTrigger>
            )}
            <TabsTrigger value="preview" onClick={!preview ? loadPreview : undefined}>
              <Eye className="mr-1.5 h-3 w-3" /> Preview
            </TabsTrigger>
          </TabsList>

          {/* Columns */}
          <TabsContent value="columns">
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["#", "Column", "Type", "Nullable", "Key", "Default", "Extra", "Comment"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.columns.map((col) => (
                    <tr key={col.COLUMN_NAME} className="border-t hover:bg-muted/25 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground text-xs">{col.ORDINAL_POSITION}</td>
                      <td className="px-3 py-2 font-mono font-medium text-xs">{col.COLUMN_NAME}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{col.COLUMN_TYPE}</td>
                      <td className="px-3 py-2 text-xs">
                        <Badge variant={col.IS_NULLABLE === "YES" ? "secondary" : "outline"} className="text-[10px]">
                          {col.IS_NULLABLE}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{keyBadge(col.COLUMN_KEY)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {col.COLUMN_DEFAULT ?? <span className="italic">—</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{col.EXTRA || "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{col.COLUMN_COMMENT || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Indexes */}
          <TabsContent value="indexes">
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Name", "Unique", "Column", "Seq", "Type"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.indexes.map((idx, i) => (
                    <tr key={i} className="border-t hover:bg-muted/25 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs">
                        {idx.INDEX_NAME === "PRIMARY" ? (
                          <span className="flex items-center gap-1"><Key className="h-3 w-3 text-amber-500" /> PRIMARY</span>
                        ) : idx.INDEX_NAME}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={idx.NON_UNIQUE === 0 ? "success" : "secondary"} className="text-[10px]">
                          {idx.NON_UNIQUE === 0 ? "Yes" : "No"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{idx.COLUMN_NAME}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{idx.SEQ_IN_INDEX}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{idx.INDEX_TYPE}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Foreign Keys */}
          <TabsContent value="fk">
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Constraint", "Column", "References"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.foreign_keys.map((fk, i) => (
                    <tr key={i} className="border-t hover:bg-muted/25 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs">{fk.CONSTRAINT_NAME}</td>
                      <td className="px-3 py-2 font-mono text-xs">{fk.COLUMN_NAME}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className="flex items-center gap-1">
                          <Link2 className="h-3 w-3 text-primary" />
                          <span className="font-mono">{fk.REFERENCED_TABLE_NAME}({fk.REFERENCED_COLUMN_NAME})</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview">
            {loadingPreview ? (
              <LoadingState message="Loading preview..." />
            ) : preview ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{preview.count} rows (LIMIT 100)</span>
                  <Badge variant="warning" className="text-[10px]">Read-only preview</Badge>
                </div>
                <DataTable columns={preview.columns} rows={preview.rows} />
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Click the Preview tab to load data.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
