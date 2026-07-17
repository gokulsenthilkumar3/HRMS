'use client';
import React from 'react';
import { Mail, Phone, Building2 } from 'lucide-react';

interface Props { fullName:string; designation?:string; department?:string; employeeId?:string; email:string; phone?:string; avatarUrl?:string; performanceRating?:number; hireDate?:string; }

export default function EmployeeCard3D({ fullName,designation,department,employeeId,email,phone,avatarUrl,performanceRating,hireDate }:Props) {
  const initial = fullName?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const tenure = hireDate ? Math.floor((Date.now()-new Date(hireDate).getTime())/31536000000) : 0;
  return (
    <div className="card3d-scene">
      <div className="card3d-inner">
        {/* Front */}
        <div className="card3d-front">
          <div className="card3d-avatar">{avatarUrl?<img src={avatarUrl} alt={fullName}/>:<span>{initial}</span>}</div>
          <div className="card3d-name">{fullName}</div>
          <div className="card3d-desg">{designation ?? '—'}</div>
          <div className="card3d-dept"><Building2 size={11}/> {department ?? '—'}</div>
          <div className="card3d-id">{employeeId}</div>
        </div>
        {/* Back */}
        <div className="card3d-back">
          <div className="card3d-back-title">Employee Stats</div>
          <div className="card3d-stat"><span className="cbl">Rating</span><span className="cbv">{performanceRating ?? '—'} / 5 ⭐</span></div>
          <div className="card3d-stat"><span className="cbl">Tenure</span><span className="cbv">{tenure} yr{tenure!==1?'s':''}</span></div>
          <div className="card3d-stat"><span className="cbl">Email</span><span className="cbv sm">{email}</span></div>
          {phone&&<div className="card3d-stat"><span className="cbl">Phone</span><span className="cbv sm">{phone}</span></div>}
        </div>
      </div>
      <style>{card3dStyles}</style>
    </div>
  );
}

const card3dStyles=`
.card3d-scene{width:200px;height:270px;perspective:800px;}
.card3d-inner{width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform 0.6s cubic-bezier(0.4,0,0.2,1);}
.card3d-scene:hover .card3d-inner{transform:rotateY(180deg);}
.card3d-front,.card3d-back{position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:20px;}
.card3d-front{background:linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02));}
.card3d-back{background:linear-gradient(145deg,#1A1B2E,#13141A);transform:rotateY(180deg);align-items:flex-start;justify-content:flex-start;gap:12px;}
.card3d-avatar{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#8B5CF6);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800;color:#fff;overflow:hidden;}
.card3d-avatar img{width:100%;height:100%;object-fit:cover;}
.card3d-name{font-family:var(--font-sora,sans-serif);font-size:0.9rem;font-weight:800;color:#F0F2FF;text-align:center;}
.card3d-desg{font-size:0.72rem;color:#9BA3C0;text-align:center;}
.card3d-dept{display:flex;align-items:center;gap:4px;font-size:0.68rem;color:#4B5278;}
.card3d-id{font-size:0.7rem;color:#6366F1;font-weight:700;margin-top:4px;}
.card3d-back-title{font-family:var(--font-sora,sans-serif);font-size:0.82rem;font-weight:800;color:#F0F2FF;margin-bottom:4px;}
.card3d-stat{display:flex;justify-content:space-between;width:100%;gap:8px;}
.cbl{font-size:0.68rem;color:#4B5278;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;}
.cbv{font-size:0.75rem;color:#F0F2FF;font-weight:700;text-align:right;} .cbv.sm{font-size:0.65rem;}
`;
