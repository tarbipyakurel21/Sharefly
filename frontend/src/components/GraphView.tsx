import cytoscape from "cytoscape";
import { useEffect, useRef } from "react";
import { LEVEL_COLOR, defang } from "../format";
import type { Analysis } from "../types";

interface Props {
  graph: Analysis["graph"];
  clusters: Analysis["clusters"];
  selectedClusterId: string | null;
  onSelectCluster: (id: string | null) => void;
}

const NODE_COLOR = { account: "#38bdf8", message: "#cbd5e1", url: "#a78bfa" };

const LEGEND = [
  { label: "Account", color: NODE_COLOR.account, shape: "rounded-full" },
  { label: "Message", color: NODE_COLOR.message, shape: "rounded-[3px]" },
  { label: "Link", color: NODE_COLOR.url, shape: "rotate-45" },
];

export default function GraphView({ graph, clusters, selectedClusterId, onSelectCluster }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const onSelect = useRef(onSelectCluster);
  onSelect.current = onSelectCluster;

  useEffect(() => {
    if (!container.current) return;
    const levelOf = new Map(clusters.map((c) => [c.id, c.level]));
    const cy = cytoscape({
      container: container.current,
      elements: [
        ...graph.nodes.map((n) => ({
          data: {
            id: n.id,
            type: n.type,
            label: n.type === "url" ? defang(n.label) : n.label,
            cluster: n.cluster_id ?? "",
            ring: n.cluster_id ? LEVEL_COLOR[levelOf.get(n.cluster_id) ?? "low"] : "#070b14",
            color: NODE_COLOR[n.type],
          },
        })),
        ...graph.edges.map((e) => ({
          data: { id: e.id, source: e.source, target: e.target, type: e.type },
        })),
      ],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            "border-color": "data(ring)",
            "border-width": 2.5,
            label: "data(label)",
            color: "#94a3b8",
            "font-size": 10,
            "font-family": "ui-monospace, Menlo, monospace",
            "text-valign": "bottom",
            "text-margin-y": 4,
            "text-wrap": "ellipsis",
            "text-max-width": "110px",
            width: 16,
            height: 16,
          },
        },
        { selector: 'node[type="account"]', style: { width: 22, height: 22, color: "#bae6fd" } },
        { selector: 'node[type="message"]', style: { shape: "round-rectangle" } },
        { selector: 'node[type="url"]', style: { shape: "diamond", width: 20, height: 20, color: "#ddd6fe" } },
        {
          selector: "edge",
          style: { width: 1.2, "line-color": "#334766", "curve-style": "straight" },
        },
        { selector: 'edge[type="contains"]', style: { "line-color": "#6d5bb5" } },
        {
          selector: 'edge[type="similar"]',
          style: { "line-color": "#d9a13a", "line-style": "dashed", width: 1 },
        },
        { selector: ".dim", style: { opacity: 0.1 } },
      ],
      layout: {
        name: "cose",
        animate: false,
        randomize: true,
        padding: 30,
        nodeRepulsion: () => 9000,
        idealEdgeLength: () => 55,
        componentSpacing: 55,
        numIter: 2500,
      },
      minZoom: 0.2,
      maxZoom: 3,
    });
    cy.on("tap", (event) => {
      if (event.target === cy) onSelect.current(null);
      else if (event.target.isNode()) onSelect.current(event.target.data("cluster") || null);
    });
    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [graph, clusters]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass("dim");
    if (!selectedClusterId) {
      cy.animate({ fit: { eles: cy.elements(), padding: 30 }, duration: 300 });
      return;
    }
    const members = cy.nodes(`[cluster = "${selectedClusterId}"]`);
    const focus = members.union(members.edgesWith(members));
    cy.elements().difference(focus).addClass("dim");
    cy.animate({ fit: { eles: members, padding: 60 }, duration: 300 });
  }, [selectedClusterId, graph, clusters]);

  return (
    <div className="relative h-full">
      <div ref={container} className="h-full w-full" data-testid="graph" />
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5 rounded-md border border-line bg-ink-900/90 px-3 py-2 text-[11px] text-slate-400">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 ${item.shape}`} style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
        <span className="flex items-center gap-2">
          <span className="w-2.5 border-t border-dashed border-amber-400" />
          Similar wording
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-orange-400" />
          Outline = in a flagged cluster
        </span>
      </div>
      <button
        onClick={() => onSelectCluster(null)}
        className="absolute bottom-3 right-3 rounded-md border border-line bg-ink-900/90 px-2.5 py-1 text-xs text-slate-300 hover:bg-ink-700"
      >
        Show all
      </button>
    </div>
  );
}
