'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Calendar, AlertCircle, LogIn, LogOut, CheckCircle } from 'lucide-react';

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
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);

  const { data:calendar=[], isLoading:calLoad } = useQuery({
    queryKey:['attendance-cal',year,month],
    queryFn:()=>api.get<any[]>(`/attendance/calendar?year=${year}&month=${month}`),
    staleTime:30_000,
  });
  const { data:balance=[] } = useQuery({
    queryKey:['leave-balance'],
    queryFn:()=>api.get<any[]>('/attendance/balance'),
    staleTime:60_000,
  });

  const clockIn = useMutation({
    mutationFn:()=>api.post('/attendance/clock-in',{}),
    onSuccess:()=>{
      qc.invalidateQueries({queryKey:['attendance-cal']});
      setIsClockedIn(true);
      setClockInTime(new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }));
    },
  });
  const clockOut = useMutation({
    mutationFn:()=>api.post('/attendance/clock-out',{}),
    onSuccess:()=>{
      qc.invalidateQueries({queryKey:['attendance-cal']});
      setIsClockedIn(false);
      setClockInTime(null);
    },
  });
  const submitLeave = useMutation({
    mutationFn:(d:any)=>api.post('/attendance/leave',d),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['leave-balance']}); setShowLeaveForm(false); },
  });

  const monthName = new Date(year,month-1).toLocaleString('default',{month:'long',year:'numeric'});

  return (
    <div className="att-page">
      <div className="att-header">
        <div>
          <h1><Calendar size={22}/> Attendance &amp; Leave</h1>
          {isClockedIn && clockInTime && (
            <p style={{ fontSize:'0.8rem', color:'#10B981', marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
              <CheckCircle size={13}/> Clocked in at {clockInTime}
            </p>
          )}
        </div>
        <div className="att-actions">
          <button
            className={`btn-clockin${isClockedIn ? ' clocked-in' : ''}`}
            onClick={()=>clockIn.mutate()}
            disabled={clockIn.isPending || isClockedIn}
            title={isClockedIn ? 'Already clocked in' : 'Clock In'}
          >
            <LogIn size={14}/>
            {clockIn.isPending ? 'Processing...' : isClockedIn ? 'Clocked In' + ' \u2713' : 'Clock In'}
          </button>
          <button
            className="btn-clockout"
            onClick={()=>clockOut.mutate()}
            disabled={clockOut.isPending || !isClockedIn}
            title={!isClockedIn ? 'Not clocked in yet' : 'Clock Out'}
          >
            <LogOut size={14}/>
            {clockOut.isPending ? 'Processing...' : 'Clock Out'}
          </button>
          <button className="btn-leave" onClick={()=>setShowLeaveForm(true)}>+ Request Leave</button>
        </div>
      </div>

      <div className="balance-row">
        {(balance as any[]).length === 0
          ? Array(4).fill(0).map((_,i) => <div key={i} className="balance-card skeleton-box" style={{ height:80, borderRadius:12 }} />)
          : (balance as any[]).map((b:any)=>(
            <div key={b.type} className="balance-card">
              <div className="bal-type">{b.type}</div>
              <div className="bal-nums">
                <span className="bal-rem">{b.remaining}</span>
                <span className="bal-sep">/</span>
                <span className="bal-tot">{b.limit}</span>
              </div>
              <div className="bal-bar"><div className="bal-fill" style={{width:`${b.limit>0?(b.used/b.limit*100):0}%`}}/></div>
            </div>
          ))}
      </div>

      <div className="cal-nav">
        <button onClick={()=>{ if(month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); }}>&#8249;</button>
        <span>{monthName}</span>
        <button onClick={()=>{ if(month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); }}>&#8250;</button>
      </div>

      <div className="cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} className="cal-dow">{d}</div>)}
        {!calLoad && (calendar as any[]).length>0 && Array((calendar as any[])[0].dayOfWeek).fill(null).map((_,i)=><div key={'e'+i}/>)}
        {calLoad
          ? Array(30).fill(0).map((_,i)=><div key={i} className="cal-day skeleton"/>)
          : (calendar as any[]).map((d:any)=>(
            <div key={d.date} className="cal-day"
              style={{background:STATUS_COLORS[d.status]+'22',borderColor:STATUS_COLORS[d.status]+'44'}}
              title={`${d.status}${d.hoursWorked?` - ${d.hoursWorked}h`:''}`}
            >
              <span className="cal-num" style={{color:STATUS_COLORS[d.status]}}>{d.day}</span>
              <span className="cal-status">{d.status==='WEEKEND'?'':d.status?.replace('_',' ')}</span>
              {d.overtime>0&&<span className="cal-ot">+{d.overtime}h OT</span>}
            </div>
          ))}
      </div>

      {showLeaveForm&&(
        <div className="att-modal-overlay" onClick={()=>setShowLeaveForm(false)}>
          <div className="att-modal-card" onClick={e=>e.stopPropagation()}>
            <h3>Request Leave</h3>
            <div className="field"><label>Leave Type</label>
              <select value={leaveForm.type} onChange={e=>setLeaveForm(f=>({...f,type:e.target.value}))}>
                {LEAVE_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field"><label>From</label><input type="date" value={leaveForm.startDate} onChange={e=>setLeaveForm(f=>({...f,startDate:e.target.value}))}/></div>
              <div className="field"><label>To</label><input type="date" value={leaveForm.endDate} onChange={e=>setLeaveForm(f=>({...f,endDate:e.target.value}))}/></div>
            </div>
            <div className="field"><label>Reason</label><textarea rows={3} value={leaveForm.reason} onChange={e=>setLeaveForm(f=>({...f,reason:e.target.value}))}/></div>
            {submitLeave.isError&&<div className="modal-err"><AlertCircle size={14}/> {(submitLeave.error as any)?.message}</div>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={()=>setShowLeaveForm(false)}>Cancel</button>
              <button className="btn-submit" disabled={submitLeave.isPending||!leaveForm.startDate||!leaveForm.endDate} onClick={()=>submitLeave.mutate(leaveForm)}>
                {submitLeave.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
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
.att-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.att-header h1{display:flex;align-items:center;gap:10px;font-family:var(--font-sora,sans-serif);font-size:1.5rem;font-weight:800;color:var(--text-primary);margin:0;}
.att-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
.btn-clockin,.btn-clockout,.btn-leave{padding:9px 16px;border-radius:10px;font-size:0.83rem;font-weight:700;border:none;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:7px;font-family:inherit;}
.btn-clockin{background:#10B981;color:#fff;}
.btn-clockin:hover:not(:disabled){background:#059669;}
.btn-clockin.clocked-in{background:rgba(16,185,129,0.15);color:#10B981;border:1px solid rgba(16,185,129,0.3);cursor:default;}
.btn-clockin:disabled{opacity:0.6;cursor:not-allowed;}
.btn-clockout{background:#F43F5E;color:#fff;}
.btn-clockout:hover:not(:disabled){background:#E11D48;}
.btn-clockout:disabled{opacity:0.4;cursor:not-allowed;}
.btn-leave{background:rgba(99,102,241,0.15);color:#818CF8;border:1px solid rgba(99,102,241,0.2);}
.btn-leave:hover{background:rgba(99,102,241,0.25);}
.balance-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
.balance-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;}
.bal-type{font-size:0.7rem;color:var(--text-secondary);font-weight:600;}
.bal-nums{display:flex;align-items:baseline;gap:3px;}
.bal-rem{font-size:1.4rem;font-weight:800;color:var(--text-primary);font-family:var(--font-sora,sans-serif);}
.bal-sep,.bal-tot{font-size:0.8rem;color:var(--text-muted);}
.bal-bar{height:3px;background:rgba(255,255,255,0.07);border-radius:2px;}
.bal-fill{height:100%;background:#6366F1;border-radius:2px;transition:width 0.6s ease;}
.cal-nav{display:flex;align-items:center;gap:16px;}
.cal-nav button{background:none;border:1px solid var(--border-color);color:var(--text-primary);width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1.1rem;transition:background 0.15s;}
.cal-nav button:hover{background:rgba(255,255,255,0.06);}
.cal-nav span{font-weight:700;color:var(--text-primary);font-size:0.95rem;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
.cal-dow{font-size:0.7rem;color:var(--text-muted);font-weight:700;text-align:center;padding:4px 0;}
.cal-day{border:1px solid transparent;border-radius:10px;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:2px;min-height:64px;transition:transform 0.15s;}
.cal-day:hover{transform:scale(1.04);}
.cal-num{font-size:0.85rem;font-weight:700;}
.cal-status{font-size:0.6rem;font-weight:600;text-align:center;opacity:0.7;}
.cal-ot{font-size:0.55rem;background:rgba(245,158,11,0.15);color:#F59E0B;border-radius:4px;padding:1px 4px;}
.cal-day.skeleton{background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%);background-size:200% 100%;animation:att-shimmer 1.4s infinite;}
@keyframes att-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.att-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center;}
.att-modal-card{background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:18px;padding:28px;width:100%;max-width:440px;display:flex;flex-direction:column;gap:16px;animation:att-slideUp 0.3s ease;}
.att-modal-card h3{font-family:var(--font-sora,sans-serif);font-size:1.1rem;font-weight:800;color:var(--text-primary);margin:0;}
.field{display:flex;flex-direction:column;gap:6px;}
.field label{font-size:0.78rem;font-weight:600;color:var(--text-secondary);}
.field input,.field select,.field textarea{background:rgba(255,255,255,0.05);border:1px solid var(--border-color);border-radius:9px;padding:10px 12px;color:var(--text-primary);font-size:0.88rem;outline:none;transition:border-color 0.2s;font-family:inherit;}
.field input:focus,.field select:focus,.field textarea:focus{border-color:#6366F1;box-shadow:0 0 0 2px rgba(99,102,241,0.12);}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.modal-err{display:flex;align-items:center;gap:6px;color:#F43F5E;font-size:0.8rem;}
.modal-actions{display:flex;gap:10px;justify-content:flex-end;}
.btn-cancel{background:none;border:1px solid var(--border-color);color:var(--text-secondary);padding:10px 18px;border-radius:9px;cursor:pointer;font-size:0.83rem;font-family:inherit;transition:all 0.15s;}
.btn-cancel:hover{background:rgba(255,255,255,0.06);}
.btn-submit{background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;border:none;padding:10px 22px;border-radius:9px;cursor:pointer;font-size:0.83rem;font-weight:700;font-family:inherit;transition:opacity 0.15s;}
.btn-submit:disabled{opacity:0.5;cursor:not-allowed;}
@keyframes att-slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:640px){.att-page{padding:16px;}.cal-grid{gap:3px;}.cal-day{min-height:48px;padding:4px 2px;}.att-header{flex-direction:column;}.att-actions{width:100%;}}
`;
