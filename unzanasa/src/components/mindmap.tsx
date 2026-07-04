"use client";

// Interactive radial mind-map renderer (dependency-free SVG).
// Root sits at the centre; branches fan out on a circle; leaves extend further.
// Branches can be collapsed/expanded by clicking their node.

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { MindMapNode } from "@/lib/ai/tutor-engine";
import { subjectColor } from "@/lib/utils";

const BRANCH_COLORS = ["indigo", "teal", "rose", "amber", "sky", "violet", "emerald", "orange"];

interface Positioned {
  node: MindMapNode;
  x: number;
  y: number;
  color: string;
  depth: number;
}

export function MindMap({ root, height = 520 }: { root: MindMapNode; height?: number }) {
  const width = 900;
  const cx = width / 2;
  const cy = height / 2;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const layout = useMemo(() => {
    const nodes: Positioned[] = [];
    const edges: { from: [number, number]; to: [number, number]; color: string }[] = [];
    const branchR = Math.min(width, height) * 0.28;
    const leafR = branchR + Math.min(width, height) * 0.16;
    const n = Math.max(1, root.children.length);

    root.children.forEach((branch, i) => {
      const color = subjectColor(BRANCH_COLORS[i % BRANCH_COLORS.length]).solid;
      // Distribute branches evenly around the circle, starting at the top.
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const bx = cx + Math.cos(angle) * branchR;
      const by = cy + Math.sin(angle) * branchR;
      nodes.push({ node: branch, x: bx, y: by, color, depth: 1 });
      edges.push({ from: [cx, cy], to: [bx, by], color });

      if (!collapsed.has(branch.label)) {
        const leaves = branch.children;
        leaves.forEach((leaf, j) => {
          // Fan leaves out around the branch's own angle.
          const spread = 0.5;
          const la = angle + (leaves.length > 1 ? (j / (leaves.length - 1) - 0.5) * spread : 0);
          const lx = cx + Math.cos(la) * leafR;
          const ly = cy + Math.sin(la) * leafR;
          nodes.push({ node: leaf, x: lx, y: ly, color, depth: 2 });
          edges.push({ from: [bx, by], to: [lx, ly], color });
        });
      }
    });

    return { nodes, edges };
  }, [root, collapsed, cx, cy, height]);

  const toggle = (label: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 600 }}>
        {/* Edges (curved) */}
        {layout.edges.map((e, i) => {
          const midX = (e.from[0] + e.to[0]) / 2;
          const midY = (e.from[1] + e.to[1]) / 2;
          return (
            <motion.path
              key={i}
              d={`M ${e.from[0]} ${e.from[1]} Q ${midX} ${e.from[1]} ${e.to[0]} ${e.to[1]}`}
              fill="none"
              stroke={e.color}
              strokeWidth={2}
              strokeOpacity={0.4}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.03 }}
            />
          );
        })}

        {/* Root */}
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }}>
          <circle cx={cx} cy={cy} r={54} fill="url(#rootGrad)" />
          <foreignObject x={cx - 50} y={cy - 30} width={100} height={60}>
            <div className="flex h-full items-center justify-center px-1 text-center text-[13px] font-bold leading-tight text-white">
              {root.label}
            </div>
          </foreignObject>
        </motion.g>

        {/* Nodes */}
        {layout.nodes.map((p, i) => {
          const isBranch = p.depth === 1;
          const hasChildren = p.node.children.length > 0;
          const w = isBranch ? 130 : 118;
          const h = isBranch ? 40 : 34;
          return (
            <motion.g
              key={p.node.label + i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.03 }}
              style={{ cursor: isBranch && hasChildren ? "pointer" : "default" }}
              onClick={() => isBranch && hasChildren && toggle(p.node.label)}
            >
              <rect
                x={p.x - w / 2}
                y={p.y - h / 2}
                width={w}
                height={h}
                rx={isBranch ? 12 : 9}
                fill={isBranch ? p.color : "rgb(var(--surface-raised))"}
                fillOpacity={isBranch ? 0.15 : 1}
                stroke={p.color}
                strokeWidth={isBranch ? 2 : 1.5}
              />
              <foreignObject x={p.x - w / 2 + 4} y={p.y - h / 2} width={w - 8} height={h}>
                <div
                  className="flex h-full items-center justify-center text-center leading-tight"
                  style={{ fontSize: isBranch ? 12 : 11, fontWeight: isBranch ? 600 : 500, color: isBranch ? p.color : "rgb(var(--ink))" }}
                >
                  {p.node.label}
                  {isBranch && hasChildren && <span className="ml-1 opacity-60">{collapsed.has(p.node.label) ? "＋" : "－"}</span>}
                </div>
              </foreignObject>
            </motion.g>
          );
        })}

        <defs>
          <linearGradient id="rootGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
