'use client';
/**
 * AttendanceHeatmap3D — GitHub-style contribution heatmap for attendance.
 * Fixes Issue #21 (Employee Self-Service) and enhances 3D analytics.
 *
 * Accepts a flat array of daily attendance scores (0–1) for the past ~52 weeks.
 */
import React, { useEffect, useRef } from 'react';

interface Props {
  /** 364 values (52 weeks × 7 days), score 0–1 */
  data?: number[];
  /** Accent colour for full attendance */
  color?: string;
  year?: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Mon','','Wed','','Fri','',''];

export default function AttendanceHeatmap3D({ data, color = '#6366F1', year = new Date().getFullYear() }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate random demo data if none supplied
  const values = data ?? Array.from({ length: 364 }, () => Math.random() > 0.15 ? Math.random() : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const COLS  = 53;
    const ROWS  = 7;
    const CELL  = 13;
    const GAP   = 3;
    const PADX  = 32;
    const PADY  = 28;
    const W     = PADX + COLS * (CELL + GAP);
    const H     = PADY + ROWS * (CELL + GAP) + 24;

    canvas.width  = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    // Month labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px system-ui,sans-serif';
    MONTHS.forEach((m, mi) => {
      const col = Math.round((mi / 12) * COLS);
      ctx.fillText(m, PADX + col * (CELL + GAP), 14);
    });

    // Day labels
    ctx.textAlign = 'right';
    DAYS.forEach((d, di) => {
      if (d) ctx.fillText(d, PADX - 4, PADY + di * (CELL + GAP) + CELL - 2);
    });
    ctx.textAlign = 'left';

    // Cells
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const idx = col * 7 + row;
        const score = values[idx] ?? 0;
        const x = PADX + col * (CELL + GAP);
        const y = PADY + row * (CELL + GAP);

        // Colour: interpolate from dark bg to accent
        const alpha = score === 0 ? 0.08 : 0.2 + score * 0.8;
        ctx.beginPath();
        (ctx as CanvasRenderingContext2D & { roundRect: (...args: unknown[]) => void }).roundRect(x, y, CELL, CELL, 3);
        ctx.fillStyle = score === 0
          ? 'rgba(255,255,255,0.05)'
          : color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }
    }

    // Legend row
    const ly = PADY + ROWS * (CELL + GAP) + 8;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px system-ui,sans-serif';
    ctx.fillText('Less', PADX, ly + CELL - 2);
    [0, 0.25, 0.5, 0.75, 1].forEach((v, vi) => {
      const lx = PADX + 28 + vi * (CELL + GAP);
      ctx.beginPath();
      (ctx as CanvasRenderingContext2D & { roundRect: (...args: unknown[]) => void }).roundRect(lx, ly, CELL, CELL, 3);
      ctx.fillStyle = v === 0 ? 'rgba(255,255,255,0.05)' : color + Math.round((0.2 + v * 0.8) * 255).toString(16).padStart(2,'0');
      ctx.fill();
    });
    ctx.fillText('More', PADX + 28 + 5 * (CELL + GAP) + 4, ly + CELL - 2);
  }, [values, color]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block' }}
        aria-label={`Attendance heatmap for ${year}`}
      />
    </div>
  );
}
