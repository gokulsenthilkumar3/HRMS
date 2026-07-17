'use client';
/**
 * DashboardGlobe3D — Enhanced animated globe with employee location pins.
 * Fixes Issue #18: 3D Analytics Dashboard with Globe.
 */
import { useEffect, useRef, useState } from 'react';

interface LocationPin {
  lat: number;
  lng: number;
  label: string;
  count: number;
  color?: string;
}

const DEFAULT_PINS: LocationPin[] = [
  { lat: 20.5,  lng: 78.9,  label: 'India',     count: 42, color: '#6366F1' },
  { lat: 37.0,  lng: -95.7, label: 'USA',       count: 28, color: '#8B5CF6' },
  { lat: 55.3,  lng: 10.4,  label: 'Europe',    count: 15, color: '#06B6D4' },
  { lat: -14.2, lng: -51.9, label: 'Brazil',    count:  8, color: '#10B981' },
  { lat: 36.2,  lng: 127.8, label: 'Korea',     count: 11, color: '#F59E0B' },
  { lat: -25.2, lng: 133.7, label: 'Australia', count:  6, color: '#EC4899' },
];

interface Props {
  pins?: LocationPin[];
}

export default function DashboardGlobe3D({ pins = DEFAULT_PINS }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number, angle = 0;
    const R = 160, N = 200;

    // Fibonacci sphere points for grid
    const pts = Array.from({ length: N }, (_, i) => ({
      theta: Math.acos(1 - 2 * (i + 0.5) / N),
      phi: Math.PI * (1 + Math.sqrt(5)) * i,
    }));

    // Convert lat/lng to spherical
    const pinPts = pins.map((p) => ({
      ...p,
      theta: (90 - p.lat) * (Math.PI / 180),
      phi: (p.lng + 180) * (Math.PI / 180),
    }));

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }

    function rotateY(x: number, z: number, a: number) {
      return { rx: x * Math.cos(a) + z * Math.sin(a), rz: -x * Math.sin(a) + z * Math.cos(a) };
    }

    function project(x: number, y: number, z: number, W: number, H: number) {
      const tilt = 0.25;
      const y1 = y * Math.cos(tilt) - z * Math.sin(tilt);
      const z1 = y * Math.sin(tilt) + z * Math.cos(tilt);
      const sc = (z1 + R * 1.5) / (R * 2.5);
      return { sx: W / 2 + x * sc, sy: H / 2 + y1 * sc, sc, z: z1 };
    }

    function draw() {
      const W = canvas!.width, H = canvas!.height;
      ctx.clearRect(0, 0, W, H);
      angle += 0.004;

      // Globe grid
      const projected = pts.map((p) => {
        const x0 = R * Math.sin(p.theta) * Math.cos(p.phi + angle);
        const y0 = R * Math.cos(p.theta);
        const z0 = R * Math.sin(p.theta) * Math.sin(p.phi + angle);
        return project(x0, y0, z0, W, H);
      });

      // Draw grid edges
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].sx - projected[j].sx;
          const dy = projected[i].sy - projected[j].sy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 32) {
            ctx.beginPath();
            ctx.moveTo(projected[i].sx, projected[i].sy);
            ctx.lineTo(projected[j].sx, projected[j].sy);
            ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - d / 32)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Globe dots
      projected.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 1.2 * p.sc + 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${0.35 + 0.55 * p.sc})`;
        ctx.fill();
      });

      // Location pins
      pinPts.forEach((p) => {
        const x0 = R * Math.sin(p.theta) * Math.cos(p.phi + angle);
        const y0 = R * Math.cos(p.theta);
        const z0 = R * Math.sin(p.theta) * Math.sin(p.phi + angle);
        const pr = project(x0, y0, z0, W, H);

        if (pr.z < -R * 0.2) return; // behind the globe

        const pinR = Math.max(4, 8 * pr.sc);
        const color = p.color || '#6366F1';

        // Pulse ring
        ctx.beginPath();
        ctx.arc(pr.sx, pr.sy, pinR * 2, 0, Math.PI * 2);
        ctx.strokeStyle = color + '55';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pin dot
        ctx.beginPath();
        ctx.arc(pr.sx, pr.sy, pinR, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(8, 10 * pr.sc)}px system-ui,sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${p.label} (${p.count})`, pr.sx, pr.sy - pinR - 4);
      });

      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [pins]);

  return <canvas ref={ref} style={{ width: '100%', height: '100%' }} aria-label="3D employee distribution globe" />;
}
