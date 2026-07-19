'use client';
/**
 * EmployeeAvatar3D — Animated humanoid canvas avatar per employee.
 * Fixes Issue #15: 3D Employee Avatar & Digital Twin.
 *
 * Renders a stylized humanoid figure with:
 * - Animated idle breathing
 * - Status ring (active/leave/remote)
 * - Role badge
 * - Name label
 */
import React, { useEffect, useRef } from 'react';

export type AvatarStatus = 'active' | 'leave' | 'remote' | 'offline';

interface Props {
  name?: string;
  role?: string;
  status?: AvatarStatus;
  accentColor?: string;
  size?: number;
}

const STATUS_COLORS: Record<AvatarStatus, string> = {
  active:  '#10B981',
  leave:   '#F59E0B',
  remote:  '#3B82F6',
  offline: '#6B7280',
};

export default function EmployeeAvatar3D({
  name = 'Employee',
  role = 'Staff',
  status = 'active',
  accentColor = '#6366F1',
  size = 220,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size + 40;
    let raf: number;
    let t = 0;
    const statusColor = STATUS_COLORS[status];
    const cx = size / 2;

    function draw() {
      t += 0.04;
      const breath = Math.sin(t) * 2; // subtle breathing
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      // ── Background circle ──
      const bgGrd = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
      bgGrd.addColorStop(0, accentColor + '22');
      bgGrd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cx, cx - 4, 0, Math.PI * 2);
      ctx.fillStyle = bgGrd;
      ctx.fill();

      // ── Status ring ──
      ctx.beginPath();
      ctx.arc(cx, cx, cx - 3, 0, Math.PI * 2);
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // ── Head ──
      const headY = cx - 52 + breath;
      ctx.beginPath();
      ctx.arc(cx, headY, 28, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();

      // Head highlight
      ctx.beginPath();
      ctx.arc(cx - 8, headY - 10, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();

      // ── Eyes ──
      [-9, 9].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(cx + ex, headY - 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + ex + 1, headY - 1, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1b4b';
        ctx.fill();
      });

      // ── Smile ──
      ctx.beginPath();
      ctx.arc(cx, headY + 6, 10, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // ── Body ──
      const bodyY = headY + 30 + breath * 0.5;
      ctx.beginPath();
      ctx.roundRect(cx - 22, bodyY, 44, 52, [8, 8, 14, 14]);
      const bodyGrd = ctx.createLinearGradient(cx - 22, bodyY, cx + 22, bodyY + 52);
      bodyGrd.addColorStop(0, accentColor);
      bodyGrd.addColorStop(1, accentColor + 'aa');
      ctx.fillStyle = bodyGrd;
      ctx.fill();

      // Shirt collar line
      ctx.beginPath();
      ctx.moveTo(cx - 10, bodyY + 2);
      ctx.lineTo(cx, bodyY + 14);
      ctx.lineTo(cx + 10, bodyY + 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Arms ──
      const armAngle = Math.sin(t * 0.6) * 0.12;
      [[-1, -30], [1, 28]].forEach(([side, armX]) => {
        ctx.save();
        ctx.translate(cx + armX, bodyY + 10);
        ctx.rotate(side * armAngle);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 38, 7);
        ctx.fillStyle = accentColor + 'cc';
        ctx.fill();
        ctx.restore();
      });

      // ── Legs ──
      [[-12, 0], [12, 0]].forEach(([lx]) => {
        const legY = bodyY + 50;
        ctx.beginPath();
        ctx.roundRect(cx + lx - 7, legY, 14, 36, 7);
        ctx.fillStyle = accentColor + '99';
        ctx.fill();
        // Shoe
        ctx.beginPath();
        ctx.ellipse(cx + lx, legY + 36, 10, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1b4b';
        ctx.fill();
      });

      // ── Name label ──
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold 12px system-ui,sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(name, cx, size + 16);
      ctx.fillStyle = statusColor;
      ctx.font = `10px system-ui,sans-serif`;
      ctx.fillText(role, cx, size + 30);

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [name, role, status, accentColor, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size + 40 }}
      aria-label={`Avatar for ${name}, status: ${status}`}
    />
  );
}
