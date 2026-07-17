'use client';
import { useEffect, useRef } from 'react';

interface Day { date: string; status: string; hoursWorked: number; }

const STATUS_H: Record<string,number> = { PRESENT:1, WFH:0.8, HALF_DAY:0.5, LEAVE:0.3, ABSENT:0.1, WEEKEND:0.05 };
const STATUS_C: Record<string,string> = { PRESENT:'#10B981', WFH:'#6366F1', HALF_DAY:'#06B6D4', LEAVE:'#F59E0B', ABSENT:'#F43F5E', WEEKEND:'#2D2F3D' };

export default function AttendanceHeatmap3D({ data }: { data: Day[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas=ref.current; if(!canvas||!data.length) return;
    const ctx=canvas.getContext('2d')!;
    let prog=0, raf:number;
    function resize(){canvas!.width=canvas!.offsetWidth;canvas!.height=canvas!.offsetHeight;}
    function draw(){
      prog=Math.min(1,prog+0.03);
      const W=canvas!.width,H=canvas!.height;
      ctx.clearRect(0,0,W,H);
      const cols=7,rows=Math.ceil(data.length/7);
      const pw=Math.floor(W/cols)-4, ph=Math.floor((H*0.85)/rows);
      const maxH=ph*2.5;
      data.forEach((d,i)=>{
        const col=i%7,row=Math.floor(i/7);
        const x=col*(pw+4)+2, bh=Math.round(maxH*(STATUS_H[d.status]||0.05)*prog);
        const y=H-ph*(row+1)-bh+ph*0.3;
        // 3D top face
        ctx.fillStyle=STATUS_C[d.status]||'#2D2F3D';
        ctx.fillRect(x,y,pw,bh);
        // shaded right side
        ctx.fillStyle='rgba(0,0,0,0.25)';
        ctx.fillRect(x+pw,y+4,6,bh);
        // top highlight
        ctx.fillStyle='rgba(255,255,255,0.12)';
        ctx.fillRect(x,y,pw,4);
        // day label
        ctx.fillStyle='#9BA3C0'; ctx.font='9px Inter,sans-serif'; ctx.textAlign='center';
        ctx.fillText(String(new Date(d.date).getDate()),x+pw/2,H-ph*row+2);
      });
      if(prog<1) raf=requestAnimationFrame(draw);
    }
    resize(); draw(); window.addEventListener('resize',()=>{resize();prog=0;draw();});
    return()=>cancelAnimationFrame(raf);
  },[data]);
  return <canvas ref={ref} style={{width:'100%',height:220}} />;
}
