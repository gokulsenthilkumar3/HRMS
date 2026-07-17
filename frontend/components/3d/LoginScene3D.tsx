'use client';
import { useEffect, useRef } from 'react';

/** Mouse-parallax crystal mesh — pure Canvas 2D, no external lib */
export default function LoginScene3D() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener('mousemove', onMouseMove);

    // Icosahedron vertices (simplified 12-point)
    const t = (1 + Math.sqrt(5)) / 2;
    const BASE_VERTS: [number,number,number][] = [
      [-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],
      [t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1],
    ].map(([x,y,z]) => { const l=Math.sqrt(x*x+y*y+z*z); return [x/l,y/l,z/l]; }) as [number,number,number][];

    const EDGES: [number,number][] = [
      [0,1],[0,5],[0,7],[0,10],[0,11],[1,5],[1,7],[1,8],[1,9],[2,3],[2,6],[2,10],[2,11],[2,4],
      [3,4],[3,6],[3,8],[3,9],[4,5],[4,9],[4,11],[5,9],[5,11],[6,7],[6,8],[6,10],[7,8],[7,10],
    ];

    let angle = 0;
    function resize() { canvas!.width=canvas!.offsetWidth; canvas!.height=canvas!.offsetHeight; }

    function draw() {
      const W=canvas!.width, H=canvas!.height, cx=W/2, cy=H/2, R=Math.min(W,H)*0.32;
      ctx.clearRect(0,0,W,H); angle+=0.006;
      // Parallax offset from mouse
      const mx=(mouse.current.x-0.5)*0.6, my=(mouse.current.y-0.5)*0.4;
      const ca=Math.cos(angle+mx), sa=Math.sin(angle+mx);
      const cb=Math.cos(my),       sb=Math.sin(my);

      const proj = BASE_VERTS.map(([x,y,z]) => {
        // rotate Y
        const x1=x*ca+z*sa, z1=-x*sa+z*ca;
        // rotate X
        const y2=y*cb-z1*sb, z2=y*sb+z1*cb;
        const scale=(z2+2)/3;
        return { sx:cx+x1*R*scale, sy:cy+y2*R*scale, z:z2, scale };
      });

      // Faces (filled triangles, back-to-front)
      const faces=[[0,1,5],[0,5,11],[0,11,10],[0,10,7],[0,7,1],[3,4,9],[3,9,8],[3,8,6],[3,6,2],[3,2,4]];
      const sorted=[...faces].sort((a,b)=>(proj[a[0]].z+proj[a[1]].z+proj[a[2]].z)-(proj[b[0]].z+proj[b[1]].z+proj[b[2]].z));
      for(const [a,b,c] of sorted){
        ctx.beginPath(); ctx.moveTo(proj[a].sx,proj[a].sy); ctx.lineTo(proj[b].sx,proj[b].sy); ctx.lineTo(proj[c].sx,proj[c].sy); ctx.closePath();
        const avgZ=(proj[a].z+proj[b].z+proj[c].z)/3;
        ctx.fillStyle=`rgba(99,102,241,${0.04+0.06*(avgZ+1)})`;
        ctx.strokeStyle=`rgba(139,92,246,${0.3+0.3*(avgZ+1)})`;
        ctx.lineWidth=0.8; ctx.fill(); ctx.stroke();
      }
      // Vertices
      proj.forEach(p=>{ ctx.beginPath(); ctx.arc(p.sx,p.sy,2.5*p.scale+0.5,0,Math.PI*2); ctx.fillStyle=`rgba(167,139,250,${0.5+0.5*p.scale})`; ctx.fill(); });
      raf=requestAnimationFrame(draw);
    }
    resize(); draw(); window.addEventListener('resize',resize);
    return()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',resize); window.removeEventListener('mousemove',onMouseMove); };
  },[]);

  return <canvas ref={ref} style={{width:'100%',height:'100%'}} aria-hidden />;
}
