'use client';
import { useEffect, useRef } from 'react';

export default function DashboardGlobe3D() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number, angle = 0;
    const R = 180, N = 220;
    const pts = Array.from({ length: N }, (_, i) => ({ theta: Math.acos(1 - 2*(i+.5)/N), phi: Math.PI*(1+Math.sqrt(5))*i }));
    function resize() { canvas!.width = canvas!.offsetWidth; canvas!.height = canvas!.offsetHeight; }
    function draw() {
      const W = canvas!.width, H = canvas!.height, cx = W/2, cy = H/2;
      ctx.clearRect(0,0,W,H); angle += 0.003;
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const proj = pts.map(p => {
        const x0=R*Math.sin(p.theta)*Math.cos(p.phi), y0=R*Math.sin(p.theta)*Math.sin(p.phi), z0=R*Math.cos(p.theta);
        const x1=x0*ca+z0*sa, z1=-x0*sa+z0*ca;
        const tilt=0.25, y1=y0*Math.cos(tilt)-z1*Math.sin(tilt), z2=y0*Math.sin(tilt)+z1*Math.cos(tilt);
        const sc=(z2+R*1.5)/(R*2.5);
        return { sx:cx+x1*sc, sy:cy+y1*sc, sc };
      });
      for(let i=0;i<proj.length;i++) for(let j=i+1;j<proj.length;j++) {
        const dx=proj[i].sx-proj[j].sx, dy=proj[i].sy-proj[j].sy, d=Math.sqrt(dx*dx+dy*dy);
        if(d<36){ ctx.beginPath(); ctx.moveTo(proj[i].sx,proj[i].sy); ctx.lineTo(proj[j].sx,proj[j].sy); ctx.strokeStyle=`rgba(99,102,241,${0.15*(1-d/36)})`; ctx.lineWidth=0.5; ctx.stroke(); }
      }
      proj.forEach(p => { ctx.beginPath(); ctx.arc(p.sx,p.sy,1.5*p.sc+0.5,0,Math.PI*2); ctx.fillStyle=`rgba(139,92,246,${0.4+0.6*p.sc})`; ctx.fill(); });
      raf = requestAnimationFrame(draw);
    }
    resize(); draw(); window.addEventListener('resize',resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  },[]);
  return <canvas ref={ref} style={{ width:'100%', height:'100%' }} />;
}
