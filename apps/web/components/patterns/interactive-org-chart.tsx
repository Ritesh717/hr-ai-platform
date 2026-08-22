"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import type { OrgNode } from "@/lib/api/org";

const NODE_W = 192;
const NODE_H = 86;
const H_GAP  = 28;
const V_GAP  = 68;

const DEPT_CHIP: Record<string, string> = {
  Executive:   "bg-primary/10 text-primary",
  Engineering: "bg-info/10 text-info",
  Product:     "bg-success/10 text-success",
  Design:      "bg-warning/10 text-warning",
  Operations:  "bg-danger/10 text-danger",
};

interface Pos { x: number; y: number }

function buildChildrenMap(nodes: OrgNode[]) {
  const m = new Map<string, string[]>();
  for (const n of nodes) {
    if (!m.has(n.id)) m.set(n.id, []);
    if (n.managerId) {
      if (!m.has(n.managerId)) m.set(n.managerId, []);
      m.get(n.managerId)!.push(n.id);
    }
  }
  return m;
}

function subtreeW(id: string, cm: Map<string, string[]>, col: Set<string>): number {
  if (col.has(id)) return NODE_W;
  const ch = cm.get(id) ?? [];
  if (!ch.length) return NODE_W;
  return Math.max(NODE_W, ch.reduce((s, c) => s + subtreeW(c, cm, col), 0) + (ch.length - 1) * H_GAP);
}

function layoutTree(
  id: string, level: number, leftX: number,
  cm: Map<string, string[]>, col: Set<string>,
  out: Map<string, Pos>,
) {
  const sw = subtreeW(id, cm, col);
  out.set(id, { x: leftX + (sw - NODE_W) / 2, y: level * (NODE_H + V_GAP) });
  if (col.has(id)) return;
  const ch = cm.get(id) ?? [];
  let cx = leftX;
  for (const c of ch) {
    layoutTree(c, level + 1, cx, cm, col, out);
    cx += subtreeW(c, cm, col) + H_GAP;
  }
}

interface Props {
  nodes: OrgNode[];
  search: string;
  deptFilter: string | null;
}

export function InteractiveOrgChart({ nodes, search, deptFilter }: Props) {
  const vp = useRef<HTMLDivElement>(null);
  const [tx, setTx]       = useState(40);
  const [ty, setTy]       = useState(40);
  const [scale, setScale] = useState(0.82);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [crumb, setCrumb] = useState<string[]>([]);

  const drag  = useRef<{ ox: number; oy: number; tx: number; ty: number } | null>(null);
  const pinch = useRef<{ dist: number; sc: number } | null>(null);

  const nodeMap    = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const childrenMap = useMemo(() => buildChildrenMap(nodes), [nodes]);
  const rootId     = useMemo(() => nodes.find((n) => !n.managerId)?.id ?? "", [nodes]);

  const positions = useMemo(() => {
    const out = new Map<string, Pos>();
    if (rootId) layoutTree(rootId, 0, 0, childrenMap, collapsed, out);
    return out;
  }, [rootId, childrenMap, collapsed]);

  const { totalW, totalH } = useMemo(() => {
    let w = 0, h = 0;
    positions.forEach(({ x, y }) => { w = Math.max(w, x + NODE_W); h = Math.max(h, y + NODE_H); });
    return { totalW: w + 40, totalH: h + 40 };
  }, [positions]);

  // Centre root on mount / layout change
  useEffect(() => {
    if (!vp.current || !totalW) return;
    const { width } = vp.current.getBoundingClientRect();
    const rootPos = positions.get(rootId);
    if (rootPos) setTx(width / 2 - (rootPos.x + NODE_W / 2) * scale);
  }, [rootId, totalW, scale, positions]);

  // Set initial crumb
  useEffect(() => {
    if (rootId) {
      const root = nodeMap.get(rootId);
      if (root) setCrumb([root.name]);
    }
  }, [rootId, nodeMap]);

  // Non-passive wheel zoom
  useEffect(() => {
    const el = vp.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.min(2.5, Math.max(0.25, s - e.deltaY * 0.0008)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Mouse pan
  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    drag.current = { ox: e.clientX, oy: e.clientY, tx, ty };
  }
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!drag.current) return;
      setTx(drag.current.tx + e.clientX - drag.current.ox);
      setTy(drag.current.ty + e.clientY - drag.current.oy);
    }
    function onUp() { drag.current = null; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",  onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // Touch pan + pinch
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      drag.current = { ox: t.clientX, oy: t.clientY, tx, ty };
    } else {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      pinch.current = { dist: Math.hypot(dx, dy), sc: scale };
      drag.current = null;
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 1 && drag.current) {
      const t = e.touches[0];
      setTx(drag.current.tx + t.clientX - drag.current.ox);
      setTy(drag.current.ty + t.clientY - drag.current.oy);
    } else if (e.touches.length === 2 && pinch.current) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const ratio = Math.hypot(dx, dy) / pinch.current.dist;
      setScale(Math.min(2.5, Math.max(0.25, pinch.current.sc * ratio)));
    }
  }
  function onTouchEnd() { drag.current = null; pinch.current = null; }

  // Node click: centre + toggle collapse + breadcrumb
  function onNodeClick(node: OrgNode) {
    const pos = positions.get(node.id);
    if (pos && vp.current) {
      const { width, height } = vp.current.getBoundingClientRect();
      setTx(width  / 2 - (pos.x + NODE_W / 2) * scale);
      setTy(height / 2 - (pos.y + NODE_H / 2) * scale);
    }
    const hasKids = (childrenMap.get(node.id) ?? []).length > 0;
    if (hasKids) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.has(node.id) ? next.delete(node.id) : next.add(node.id);
        return next;
      });
    }
    const path: string[] = [];
    let cur: OrgNode | undefined = node;
    while (cur) { path.unshift(cur.name); cur = cur.managerId ? nodeMap.get(cur.managerId) : undefined; }
    setCrumb(path);
  }

  // Fit-to-screen
  function fitView() {
    if (!vp.current || !totalW) return;
    const { width, height } = vp.current.getBoundingClientRect();
    const newSc = Math.min(0.85, Math.min(width / (totalW + 40), height / (totalH + 40)));
    setScale(newSc);
    setTx((width  - totalW * newSc) / 2);
    setTy(40);
  }

  // Search match
  const q = search.toLowerCase();
  const isMatch = useCallback((n: OrgNode) => {
    if (deptFilter && n.department !== deptFilter) return false;
    if (!q) return true;
    return n.name.toLowerCase().includes(q) || n.role.toLowerCase().includes(q);
  }, [q, deptFilter]);

  // SVG connections
  const conns: { k: string; d: string }[] = [];
  positions.forEach((pos, id) => {
    const node = nodeMap.get(id);
    if (!node?.managerId) return;
    const pp = positions.get(node.managerId);
    if (!pp) return;
    const x1 = pp.x + NODE_W / 2, y1 = pp.y + NODE_H;
    const x2 = pos.x + NODE_W / 2, y2 = pos.y;
    const cy = (y1 + y2) / 2;
    conns.push({ k: `${node.managerId}-${id}`, d: `M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}` });
  });

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Breadcrumb */}
      <div className="flex min-h-[1.25rem] flex-wrap items-center gap-1 text-xs text-text-muted">
        {crumb.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-border">›</span>}
            <span className={i === crumb.length - 1 ? "font-semibold text-text" : ""}>{c}</span>
          </span>
        ))}
      </div>

      {/* Viewport */}
      <div
        ref={vp}
        className="relative flex-1 cursor-grab overflow-hidden rounded-xl border border-border bg-chip active:cursor-grabbing"
        style={{ minHeight: "480px" }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Canvas */}
        <div
          style={{
            position: "absolute",
            transformOrigin: "0 0",
            transform: `translate(${tx}px,${ty}px) scale(${scale})`,
            width: totalW,
            height: totalH,
          }}
        >
          {/* Connections */}
          <svg
            style={{ position: "absolute", inset: 0, width: totalW, height: totalH, overflow: "visible", pointerEvents: "none" }}
          >
            {conns.map(({ k, d }) => (
              <path key={k} d={d} fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeOpacity="0.6" />
            ))}
          </svg>

          {/* Nodes */}
          {Array.from(positions.entries()).map(([id, pos]) => {
            const node = nodeMap.get(id);
            if (!node) return null;
            const match = isMatch(node);
            const hasKids = (childrenMap.get(id) ?? []).length > 0;
            const isCol = collapsed.has(id);
            return (
              <button
                key={id}
                type="button"
                data-node
                onClick={() => onNodeClick(node)}
                style={{ position: "absolute", left: pos.x, top: pos.y, width: NODE_W }}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border bg-surface p-3 shadow-sm transition-[opacity,border-color] select-none text-left",
                  match ? "border-border opacity-100 hover:border-primary/50 hover:shadow-md" : "border-transparent opacity-20 pointer-events-none",
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="relative shrink-0">
                    <Avatar name={node.name} size="sm" />
                    <span className={cn(
                      "absolute -bottom-px -right-px size-2.5 rounded-full border-[1.5px] border-surface",
                      node.presence === "online" ? "bg-success" : "bg-border",
                    )} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold leading-tight text-text">{node.name}</p>
                    <p className="mt-0.5 truncate text-[10px] leading-tight text-text-muted">{node.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className={cn(
                    "truncate rounded-full px-2 py-0.5 text-[9px] font-medium",
                    DEPT_CHIP[node.department] ?? "bg-chip text-text-muted",
                  )}>
                    {node.department}
                  </span>
                  {hasKids && (
                    <span className="shrink-0 text-[9px] text-text-muted">
                      {isCol ? "▶" : "▼"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
          {([
            ["＋", () => setScale((s) => Math.min(2.5, s + 0.15))],
            ["－", () => setScale((s) => Math.max(0.25, s - 0.15))],
            ["⊡",  fitView],
          ] as const).map(([label, fn]) => (
            <button
              key={label}
              type="button"
              onClick={fn}
              className="flex size-7 items-center justify-center rounded-md border border-border bg-surface text-sm text-text-muted shadow-sm hover:border-primary hover:text-primary"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
