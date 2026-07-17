'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Clock, CheckCircle, XCircle, Calendar, AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<string,string> = {
  PRESENT:'#10B981', WFH:'#6366F1', LEAVE:'#F59E0B', ABSENT:'#F43F5E',
  HALF_DAY:'#06B6D4', WEEKEND:'#2D2F3D', HOLIDAY:'#8B5CF6',
};

const LEAVE_TYPES = ['Annual Leave','Casual Leave','Sick Leave','Maternity Leave','Paternity Leave','LOP'];

export default function AttendancePage() {
  const qc = useQueryClient();
  const now = new Date();
  const [year,setYear]   = useState(now.getFullYear());
  const [month,setMonth] = useState(now.getMonth()+1);
  const [showLeaveForm,setShowLeaveForm] = useState(false);
  const [leaveForm,setLeaveForm] = useState({ type:'Annual Leave', startDate:'', endDate:'', reason:'' });

  const { data:calendar=[], isLoading:calLoad } = useQuery({
    queryKey:['attendance-cal',year,month], queryFn:()=>api.get<any[]>(`/attendance/calendar?year=${year}&month=${month}`), staleTime:30_000,
  });
  const { data:balance=[] } = useQuery({ queryKey:['leave-balance'], queryFn:()=>api.get<any[]>('/attendance/balance'), staleTime:60_000 });

  const clockIn  = useMutation({ mutationFn:()=>api.post('/attendance/clock-in',{}),  onSuccess:()=>qc.invalidateQueries({queryKey:['attendance-cal']}) });
  const clockOut = useMutation({ mutationFn:()=>api.post('/attendance/clock-out',{}), onSuccess:()=>qc.invalidateQueries({queryKey:['attendance-cal']}) });
  const submitLeave = useMutation({
    mutationFn:(d:any)=>api.post('/attendance/leave',d),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['leave-balance']}); setShowLeaveForm(false); },
  });

  const monthName = new Date(year,month-1).toLocaleString('default',{month:'long',year:'numeric'});

  return (
    <div className="att-page">
      <div className="att-header">
        <h1><Calendar size={22}/> Attendance &amp; Leave</h1>
        <div className="att-actions">
          <button className="btn-clockin"  onClick={()=>clockIn.mutate()}  disabled={clockIn.isPending}>Clock In</button>
          <button className="btn-clockout" onClick={()=>clockOut.mutate()} disabled={clockOut.isPending}>Clock Out</button>
          <button className="btn-leave" onClick={()=>setShowLeaveForm(true)}>+ Request Leave</button>
        </div>
      </div>

      {/* Leave Balance */}
      <div className="balance-row">
        {balance.map((b:any)=>(
          <div key={b.type} className="balance-card">
            <div className="bal-type">{b.type}</div>
            <div className="bal-nums"><span className="bal-rem">{b.remaining}</span><span className="bal-sep">/</span><span className="bal-tot">{b.limit}</span></div>
            <div className="bal-bar"><div className="bal-fill" style={{width:`${b.limit>0?(b.used/b.limit*100):0}%`}}/></div>
          </div>
        ))}
      </div>

      {/* Calendar nav */}
      <div className="cal-nav">
        <button onClick={()=>{ if(month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); }}>‹</button>
        <span>{monthName}</span>
        <button onClick={()=>{ if(month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); }}>›</button>
      </div>

      {/* Calendar heatmap */}
      <div className="cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} className="cal-dow">{d}</div>)}
        {!calLoad && calendar.length>0 && Array(calendar[0].dayOfWeek).fill(null).map((_,i)=><div key={'e'+i}/>)}
        {calLoad ? Array(30).fill(0).map((_,i)=><div key={i} className="cal-day skeleton"/>)
          : calendar.map((d:any)=>(
            <div key={d.date} className="cal-day" style={{background:STATUS_COLORS[d.status]+'22',borderColor:STATUS_COLORS[d.status]+'44'}} title={`${d.status}${d.hoursWorked?` · ${d.hoursWorked}h`:''}`}>
              <span className="cal-num" style={{color:STATUS_COLORS[d.status]}}>{d.day}</span>
              <span className="cal-status">{d.status==='WEEKEND'?'':d.status?.replace('_',' ')}</span>
              {d.overtime>0&&<span className="cal-ot">+{d.overtime}h OT</span>}
            </div>
          ))}
      </div>

      {/* Leave Request Modal */}
      {showLeaveForm&&(
        <div className="modal-overlay" onClick={()=>setShowLeaveForm(false)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()}>
            <h3>Request Leave</h3>
            <div className="field"><label>Leave Type</label>
              <select value={leaveForm.type} onChange={e=>setLeaveForm(f=>({...f,type:e.target.value}))}>
                {LEAVE_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field"><label>From</label><input type="date" value={leaveForm.startDate} onChange={e=>setLeaveForm(f=>({...f,startDate:e.target.value}))}/></div>
              <div className="field"><label>To</label>  <input type="date" value={leaveForm.endDate}   onChange={e=>setLeaveForm(f=>({...f,endDate:e.target.value}))}/></div>
            </div>
            <div className="field"><label>Reason</label><textarea rows={3} value={leaveForm.reason} onChange={e=>setLeaveForm(f=>({...f,reason:e.target.value}))}/></div>
            {submitLeave.isError&&<div className="modal-err"><AlertCircle size={14}/> {(submitLeave.error as any)?.message}</div>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={()=>setShowLeaveForm(false)}>Cancel</button>
              <button className="btn-submit" disabled={submitLeave.isPending} onClick={()=>submitLeave.mutate(leaveForm)}>Submit Request</button>
            </div>
          </div>
        </div>
      )}

      <style>{attStyles}</style>
    </div>
  );
}

const attStyles=`
.att-page{padding:28px 32px;display:flex;flex-direction:column;gap:22px;max-width:1100px;}
.att-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.att-header h1{display:flex;align-items:center;gap:10px;font-family:var(--font-sora,sans-serif);font-size:1.5rem;font-weight:800;color:#F0F2FF;margin:0;}
.att-actions{display:flex;gap:10px;flex-wrap:wrap;}
.btn-clockin,.btn-clockout,.btn-leave{padding:9px 18px;border-radius:10px;font-size:0.83rem;font-weight:700;border:none;cursor:pointer;transition:all 0.15s;}
.btn-clockin{background:#10B981;color:#fff;} .btn-clockout{background:#F43F5E;color:#fff;} .btn-leave{background:rgba(99,102,241,0.15);color:#818CF8;border:1px solid rgba(99,102,241,0.2);}
.balance-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
.balance-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;}
.bal-type{font-size:0.7rem;color:#9BA3C0;font-weight:600;}
.bal-nums{display:flex;align-items:baseline;gap:3px;} .bal-rem{font-size:1.4rem;font-weight:800;color:#F0F2FF;font-family:var(--font-sora,sans-serif);} .bal-sep,.bal-tot{font-size:0.8rem;color:#4B5278;}
.bal-bar{height:3px;background:rgba(255,255,255,0.07);border-radius:2px;} .bal-fill{height:100%;background:#6366F1;border-radius:2px;transition:width 0.6s ease;}
.cal-nav{display:flex;align-items:center;gap:16px;} .cal-nav button{background:none;border:1px solid rgba(255,255,255,0.08);color:#F0F2FF;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1.1rem;} .cal-nav span{font-weight:700;color:#F0F2FF;font-size:0.95rem;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
.cal-dow{font-size:0.7rem;color:#4B5278;font-weight:700;text-align:center;padding:4px 0;}
.cal-day{border:1px solid transparent;border-radius:10px;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:2px;min-height:64px;transition:transform 0.15s;}
.cal-day:hover{transform:scale(1.04);}
.cal-num{font-size:0.85rem;font-weight:700;} .cal-status{font-size:0.6rem;font-weight:600;text-align:center;opacity:0.7;} .cal-ot{font-size:0.55rem;background:rgba(245,158,11,0.15);color:#F59E0B;border-radius:4px;padding:1px 4px;}
.cal-day.skeleton{background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center;}
.modal-card{background:#13141A;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:28px;width:100%;max-width:440px;display:flex;flex-direction:column;gap:16px;animation:slideUp 0.3s ease;}
.modal-card h3{font-family:var(--font-sora,sans-serif);font-size:1.1rem;font-weight:800;color:#F0F2FF;margin:0;}
.field{display:flex;flex-direction:column;gap:6px;} .field label{font-size:0.78rem;font-weight:600;color:#9BA3C0;}
.field input,.field select,.field textarea{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:9px;padding:10px 12px;color:#F0F2FF;font-size:0.88rem;outline:none;}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.modal-err{display:flex;align-items:center;gap:6px;color:#F43F5E;font-size:0.8rem;}
.modal-actions{display:flex;gap:10px;justify-content:flex-end;} .btn-cancel{background:none;border:1px solid rgba(255,255,255,0.08);color:#9BA3C0;padding:10px 18px;border-radius:9px;cursor:pointer;font-size:0.83rem;} .btn-submit{background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;border:none;padding:10px 22px;border-radius:9px;cursor:pointer;font-size:0.83rem;font-weight:700;}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
`;
