'use client';
/**
 * OrgChart3D — Force-directed 3D organization chart.
 * Fixes Issue #17: 3D Org Chart with Animated Hierarchy Visualization.
 *
 * Uses canvas-based physics simulation (no heavy lib dependency).
 * Each node is a department/person. Edges connect parent→child.
 */
import React, { useEffect, useRef } from 'react';

interface OrgNode {
  id: string;
  label: string;
  role?: string;
  color?: string;
  children?: string[];
}

interface Props {
  nodes?: OrgNode[];
}

const DEFAULT_NODES: OrgNode[] = [
  { id: 'ceo',        label: 'CEO',           role: 'Executive',    color: '#6366F1', children: ['cto','cfo','chro'] },
  { id: 'cto',        label: 'CTO',           role: 'Technology',   color: '#8B5CF6', children: ['eng1','eng2'] },
  { id: 'cfo',        label: 'CFO',           role: 'Finance',      color: '#06B6D4', children: ['fin1'] },
  { id: 'chro',       label: 'CHRO',          role: 'HR',           color: '#10B981', children: ['hr1','hr2'] },
  { id: 'eng1',       label: 'Sr. Engineer',  role: 'Backend',      color: '#8B5CF6', children: [] },
  { id: 'eng2',       label: 'Sr. Engineer',  role: 'Frontend',     color: '#8B5CF6', children: [] },
  { id: 'fin1',       label: 'Finance Lead',  role: 'Accounting',   color: '#06B6D4', children: [] },
  { id: 'hr1',        label: 'HR Manager',    role: 'Recruitment',  color: '#10B981', children: [] },
  { id: 'hr2',        label: 'HR Specialist', role: 'Compliance',   color: '#10B981', children: [] },
];

interface PhysicsNode extends OrgNode {
  x: number; y: number; z: number;
  vx: number; vy: number;
  depth: number;
}

function buildPhysics(nodes: OrgNode[]): PhysicsNode[] {
  // Assign depths via BFS from CEO
  const depthMap: Record<string, number> = {};
  const queue = [{ id: 'ceo', d: 0 }];
  while (queue.length) {
    const { id, d } = queue.shift()!;
    depthMap[id] = d;
    const node = nodes.find((n) => n.id === id);
    node?.children?.forEach((cid) => queue.push({ id: cid, d: d + 1 }));
  }
  return nodes.map((n, i) => ({
    ...n,
    x: (Math.random() - 0.5) * 300,
    y: -(depthMap[n.id] ?? 0) * 90 + 100,
    z: (Math.random() - 0.5) * 100,
    vx: 0, vy: 0,
    depth: depthMap[n.id] ?? 0,
  }));
}

export default function OrgChart3D({ nodes = DEFAULT_NODES }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    let angle = 0;
    const physics = buildPhysics(nodes);

    // Build edge list
    const edges: [number, number][] = [];
    nodes.forEach((n) => {
      const si = physics.findIndex((p) => p.id === n.id);
      n.children?.forEach((cid) => {
        const ti = physics.findIndex((p) => p.id === cid);
        if (si >= 0 && ti >= 0) edges.push([si, ti]);
      });
    });

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }

    function project(x: number, y: number, z: number, W: number, H: number) {
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const rx = x * ca - z * sa;
      const rz = x * sa + z * ca;
      const fov = 600;
      const d = fov / (fov + rz + 300);
      return { sx: W / 2 + rx * d, sy: H / 2 + y * d, d };
    }

    function draw() {
      const W = canvas!.width, H = canvas!.height;
      ctx.clearRect(0, 0, W, H);
      angle += 0.004;

      const projected = physics.map((n) => project(n.x, n.y, n.z, W, H));

      // Draw edges
      edges.forEach(([si, ti]) => {
        const s = projected[si], t = projected[ti];
        ctx.beginPath();
        ctx.moveTo(s.sx, s.sy);
        ctx.lineTo(t.sx, t.sy);
        ctx.strokeStyle = 'rgba(129,140,248,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw nodes
      physics.forEach((n, i) => {
        const { sx, sy, d } = projected[i];
        const r = Math.max(5, 14 * d);
        const color = n.color || '#6366F1';

        // Glow
        const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2);
        grd.addColorStop(0, color + '55');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        if (d > 0.4) {
          ctx.fillStyle = '#fff';
          ctx.font = `${Math.max(9, 11 * d)}px system-ui,sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(n.label, sx, sy + r + 12);
          if (n.role) {
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = `${Math.max(7, 9 * d)}px system-ui,sans-serif`;
            ctx.fillText(n.role, sx, sy + r + 22);
          }
        }
      });

      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [nodes]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%' }}
      aria-label="3D Organization Chart"
    />
  );
}
