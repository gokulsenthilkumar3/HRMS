'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Users, Briefcase, TrendingUp, ChevronRight, GripVertical } from 'lucide-react';

const STAGES = ['APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED'] as const;
const STAGE_COLORS: Record<string,string> = { APPLIED:'#6366F1', SCREENING:'#F59E0B', INTERVIEW:'#06B6D4', OFFER:'#8B5CF6', HIRED:'#10B981', REJECTED:'#F43F5E' };

export default function RecruitmentPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<'kanban'|'analytics'>('kanban');
  const { data:kanban } = useQuery({ queryKey:['kanban'], queryFn:()=>api.get<any>('/recruitment/kanban'), staleTime:30_000 });
  const { data:analytics } = useQuery({ queryKey:['rec-analytics'], queryFn:()=>api.get<any>('/recruitment/analytics'), staleTime:60_000, enabled: view==='analytics' });

  const moveStage = useMutation({
    mutationFn:({id,stage}:{id:string;stage:string})=>api.patch(`/recruitment/applications/${id}/stage`,{stage}),
    onSuccess:()=>qc.invalidateQueries({queryKey:['kanban']}),
  });

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('appId');
    if (id) moveStage.mutate({ id, stage });
  };

  return (
    <div className="rec-page">
      <div className="rec-header">
        <h1><Briefcase size={22}/> Recruitment Pipeline</h1>
        <div className="view-toggle">
          <button className={view==='kanban'?'active':''} onClick={()=>setView('kanban')}>Kanban</button>
          <button className={view==='analytics'?'active':''} onClick={()=>setView('analytics')}><TrendingUp size={14}/> Analytics</button>
        </div>
      </div>

      {view==='kanban' && (
        <div className="kanban-board">
          {STAGES.map(stage => (
            <div key={stage} className="kanban-col"
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>handleDrop(e, stage)}
            >
              <div className="kanban-col-header" style={{borderTopColor:STAGE_COLORS[stage]}}>
                <span className="stage-dot" style={{background:STAGE_COLORS[stage]}}/>  {stage}
                <span className="stage-count">{kanban?.[stage]?.length??0}</span>
              </div>
              <div className="kanban-cards">
                {(kanban?.[stage]??[]).map((app:any)=>(
                  <div key={app.id} className="kanban-card"
                    draggable
                    onDragStart={e=>e.dataTransfer.setData('appId',app.id)}
                  >
                    <GripVertical size={12} style={{color:'#4B5278',flexShrink:0}}/>
                    <div className="kc-body">
                      <div className="kc-name">{app.candidate?.name}</div>
                      <div className="kc-role">{app.job?.title}</div>
                      <div className="kc-meta">{app.source} · {new Date(app.appliedAt).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view==='analytics' && analytics && (
        <div className="rec-analytics">
          <div className="kpi-grid">
            {[['Total Applications',analytics.total,'#6366F1'],['Hired',analytics.hired,'#10B981'],['Avg Time to Hire',`${analytics.avgTimeToHireDays} days`,'#F59E0B'],['Offer Acceptance',`${analytics.offerAcceptanceRate}%`,'#8B5CF6']].map(([l,v,c])=>(
              <div key={String(l)} className="kpi-card">
                <div className="kpi-val" style={{color:String(c)}}>{v}</div>
                <div className="kpi-lbl">{l}</div>
              </div>
            ))}
          </div>
          <div className="source-breakdown">
            <h3>Source of Hire</h3>
            {Object.entries(analytics.sourceBreakdown??{}).map(([src,count])=>(
              <div key={src} className="src-row"><span>{src}</span><span className="src-count">{String(count)}</span></div>
            ))}
          </div>
        </div>
      )}

      <style>{recStyles}</style>
    </div>
  );
}

const recStyles=`
.rec-page{padding:28px 32px;display:flex;flex-direction:column;gap:22px;height:calc(100vh - 64px);overflow:hidden;}
.rec-header{display:flex;align-items:center;justify-content:space-between;}
.rec-header h1{display:flex;align-items:center;gap:10px;font-family:var(--font-sora,sans-serif);font-size:1.5rem;font-weight:800;color:#F0F2FF;margin:0;}
.view-toggle{display:flex;gap:4px;background:rgba(255,255,255,0.04);border-radius:10px;padding:4px;}
.view-toggle button{background:none;border:none;color:#9BA3C0;padding:7px 16px;border-radius:7px;cursor:pointer;font-size:0.82rem;font-weight:600;display:flex;align-items:center;gap:5px;}
.view-toggle button.active{background:rgba(255,255,255,0.07);color:#F0F2FF;}
.kanban-board{display:grid;grid-template-columns:repeat(6,minmax(180px,1fr));gap:12px;overflow-x:auto;flex:1;align-items:start;padding-bottom:16px;}
.kanban-col{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:12px;display:flex;flex-direction:column;gap:8px;min-height:300px;overflow:hidden;}
.kanban-col-header{display:flex;align-items:center;gap:6px;padding:12px 14px 8px;font-size:0.72rem;font-weight:800;color:#9BA3C0;text-transform:uppercase;letter-spacing:0.07em;border-top:3px solid transparent;}
.stage-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.stage-count{margin-left:auto;background:rgba(255,255,255,0.08);color:#F0F2FF;font-size:0.65rem;width:18px;height:18px;border-radius:5px;display:flex;align-items:center;justify-content:center;}
.kanban-cards{display:flex;flex-direction:column;gap:6px;padding:0 8px 8px;flex:1;}
.kanban-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:9px;padding:10px 10px;cursor:grab;display:flex;align-items:flex-start;gap:6px;transition:all 0.15s;}
.kanban-card:hover{background:rgba(255,255,255,0.06);transform:translateY(-1px);}
.kanban-card:active{cursor:grabbing;}
.kc-body{flex:1;display:flex;flex-direction:column;gap:3px;}
.kc-name{font-size:0.8rem;font-weight:700;color:#F0F2FF;}
.kc-role{font-size:0.7rem;color:#9BA3C0;}
.kc-meta{font-size:0.62rem;color:#4B5278;}
.rec-analytics{display:flex;flex-direction:column;gap:22px;overflow-y:auto;}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;}
.kpi-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;}
.kpi-val{font-size:1.5rem;font-weight:800;font-family:var(--font-sora,sans-serif);margin-bottom:6px;}
.kpi-lbl{font-size:0.72rem;color:#9BA3C0;font-weight:600;}
.source-breakdown{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:10px;}
.source-breakdown h3{font-size:0.82rem;font-weight:700;color:#9BA3C0;text-transform:uppercase;letter-spacing:0.05em;margin:0;}
.src-row{display:flex;justify-content:space-between;font-size:0.82rem;color:#9BA3C0;}
.src-count{background:rgba(99,102,241,0.15);color:#818CF8;padding:1px 10px;border-radius:20px;font-weight:700;}
`;
