"use client";
import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
} from "reactflow";
import dagre from "dagre";
import { useRouter } from "next/navigation";
import TableNode from "./table-node";
import type { ErdData, ErdNode, ErdEdge } from "@/lib/types";

const NODE_WIDTH = 260;
const COLUMN_ROW_HEIGHT = 28;
const NODE_HEADER_HEIGHT = 56;

const nodeTypes = { tableNode: TableNode };

function getNodeHeight(columns: ErdNode["columns"]): number {
  return NODE_HEADER_HEIGHT + columns.length * COLUMN_ROW_HEIGHT + 8;
}

function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  heightMap: Map<string, number>
): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 100, nodesep: 40, marginx: 40, marginy: 40 });

  nodes.forEach((n) => {
    const h = heightMap.get(n.id) ?? 200;
    g.setNode(n.id, { width: NODE_WIDTH, height: h });
  });
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    const h = heightMap.get(n.id) ?? 200;
    return { ...n, position: { x: x - NODE_WIDTH / 2, y: y - h / 2 } };
  });
}

function buildReactFlowData(data: ErdData) {
  const heightMap = new Map<string, number>();

  const rawNodes: Node[] = data.nodes.map((n) => {
    const h = getNodeHeight(n.columns);
    heightMap.set(n.id, h);
    return {
      id: n.id,
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: n,
    };
  });

  const rawEdges: Edge[] = data.edges.map((e) => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.source_handle,
    target: e.target,
    targetHandle: e.target_handle,
    type: "smoothstep",
    animated: e.kind === "inferred",
    label: e.kind === "inferred" ? "inferred" : undefined,
    labelStyle: { fontSize: 9, fill: "#6b7280" },
    style: {
      stroke: e.kind === "fk" ? "#3b82f6" : "#9ca3af",
      strokeWidth: e.kind === "fk" ? 2 : 1,
      strokeDasharray: e.kind === "inferred" ? "4 2" : undefined,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: e.kind === "fk" ? "#3b82f6" : "#9ca3af",
    },
  }));

  const layoutedNodes = applyDagreLayout(rawNodes, rawEdges, heightMap);
  return { nodes: layoutedNodes, edges: rawEdges };
}

function toMermaid(data: ErdData): string {
  const lines = ["erDiagram"];
  data.nodes.forEach((n) => {
    lines.push(`  ${n.table_name} {`);
    n.columns.forEach((c) => {
      const safe = c.type.replace(/[^a-zA-Z0-9_]/g, "_");
      lines.push(`    ${safe} ${c.name}`);
    });
    lines.push("  }");
  });
  data.edges.forEach((e) => {
    // source holds the FK column (many-side), target is the referenced table (one-side)
    const cardinality = e.kind === "fk" ? "||--o{" : "}o--o{";
    lines.push(`  ${e.target} ${cardinality} ${e.source} : "${e.source_handle}"`);
  });
  return lines.join("\n");
}

interface Props {
  data: ErdData;
  connectionId: number;
  database: string;
}

export function ErdCanvas({ data, connectionId, database }: Props) {
  const router = useRouter();
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildReactFlowData(data),
    [data]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [copied, setCopied] = useState(false);

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      router.push(
        `/connections/${connectionId}/tables/${node.id}?database=${database}`
      );
    },
    [router, connectionId, database]
  );

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(toMermaid(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <div className="rounded-md border bg-card/90 backdrop-blur px-2.5 py-1.5 text-[10px] text-muted-foreground">
          {data.nodes.length} tables · {data.edges.length} relationships
          {data.edges.filter((e) => e.kind === "inferred").length > 0 && (
            <span className="ml-1.5 text-amber-500">
              ({data.edges.filter((e) => e.kind === "inferred").length} inferred)
            </span>
          )}
        </div>
        <button
          onClick={handleCopyMermaid}
          className="rounded-md border bg-card/90 backdrop-blur px-2.5 py-1.5 text-[10px] font-medium hover:bg-accent transition-colors"
        >
          {copied ? "✓ Copied!" : "Copy as Mermaid"}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-30" />
        <Controls />
        <MiniMap
          nodeColor={() => "hsl(var(--primary))"}
          maskColor="hsl(var(--background) / 0.8)"
          className="!border-border"
        />
      </ReactFlow>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-[10px] text-muted-foreground">
        Double-click a table to open its details · Drag to rearrange
      </div>
    </div>
  );
}
