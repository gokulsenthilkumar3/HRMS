'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

type DayStatus = 'present' | 'absent' | 'leave' | 'holiday' | 'weekend' | 'future';

const LEAVE_BALANCES = [
  { type: 'Casual Leave',    used: 3,  total: 12, color: '#6366F1' },
  { type: 'Sick Leave',      used: 1,  total: 7,  color: '#F43F5E' },
  { type: 'Earned Leave',    used: 5,  total: 15, color: '#10B981' },
  { type: 'Comp-off',        used: 0,  total: 3,  color: '#F59E0B' },
];

// Simple mock: generate day statuses for July 2026
function getDayStatus(day: number): DayStatus {
  const today = 17;
  if (day > today) return 'future';
  const d = new Date(2026, 6, day); // July
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return 'weekend';
  if ([4, 15].includes(day)) return 'leave';
  if ([8].includes(day)) return 'absent';
  return 'present';
}

const STATUS_STYLE: Record<DayStatus, { bg: string; color: string }> = {
  present:  { bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
  absent:   { bg: 'rgba(244,63,94,0.15)',   color: '#F43F5E' },
  leave:    { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B' },
  holiday:  { bg: 'rgba(99,102,241,0.15)', color: '#818CF8' },
  weekend:  { bg: 'transparent',           color: 'var(--text-muted)' },
  future:   { bg: 'transparent',           color: 'var(--text-muted)' },
};

export default function AttendancePage() {
  const [month] = useState({ label: 'July 2026', days: 31, startDow: 3 }); // Wed start

  const blanks = Array.from({ length: month.startDow });
  const days = Array.from({ length: month.days }, (_, i) => i + 1);

  const present = days.filter((d) => getDayStatus(d) === 'present').length;
  const absent  = days.filter((d) => getDayStatus(d) === 'absent').length;
  const onLeave = days.filter((d) => getDayStatus(d) === 'leave').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">My attendance log · {month.label}</p>
        </div>
      </div>

      <div className="attend-grid">
        {/* Calendar */}
        <div className="card-premium cal-card">
          <div className="cal-header">
            <button className="cal-nav"><ChevronLeft size={16} /></button>
            <span className="cal-month">{month.label}</span>
            <button className="cal-nav"><ChevronRight size={16} /></button>
          </div>
          <div className="cal-dow-row">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="cal-dow">{d}</div>
            ))}
          </div>
          <div className="cal-grid">
            {blanks.map((_, i) => <div key={`b${i}`} />)}
            {days.map((day) => {
              const s = getDayStatus(day);
              const style = STATUS_STYLE[s];
              const isToday = day === 17;
              return (
                <div
                  key={day}
                  className={`cal-day ${isToday ? 'today' : ''}`}
                  style={{ background: style.bg, color: style.color }}
                  title={s}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="cal-legend">
            {Object.entries(STATUS_STYLE)
              .filter(([k]) => !['future','weekend'].includes(k))
              .map(([k, v]) => (
                <span key={k} className="legend-item" style={{ color: v.color }}>
                  <span className="legend-dot" style={{ background: v.color }} />
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </span>
              ))}
          </div>
        </div>

        {/* Stats + leave balances */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-premium stat-card">
            <h3 className="widget-title">This Month</h3>
            <div className="stat-row">
              <div className="stat-item" style={{ color: '#10B981' }}>
                <div className="stat-val">{present}</div>
                <div className="stat-lbl">Present</div>
              </div>
              <div className="stat-item" style={{ color: '#F43F5E' }}>
                <div className="stat-val">{absent}</div>
                <div className="stat-lbl">Absent</div>
              </div>
              <div className="stat-item" style={{ color: '#F59E0B' }}>
                <div className="stat-val">{onLeave}</div>
                <div className="stat-lbl">On Leave</div>
              </div>
            </div>
          </div>

          <div className="card-premium leave-card">
            <h3 className="widget-title">Leave Balance</h3>
            {LEAVE_BALANCES.map((lb) => (
              <div key={lb.type} className="lb-row">
                <div className="lb-info">
                  <span className="lb-type">{lb.type}</span>
                  <span className="lb-count" style={{ color: lb.color }}>
                    {lb.total - lb.used} left
                  </span>
                </div>
                <div className="lb-bar-wrap">
                  <div
                    className="lb-bar"
                    style={{
                      width: `${((lb.total - lb.used) / lb.total) * 100}%`,
                      background: lb.color,
                    }}
                  />
                </div>
                <div className="lb-used">{lb.used}/{lb.total} used</div>
              </div>
            ))}

            <button className="btn btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
              <CalendarDays size={15} /> Apply for Leave
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .page-container { padding: 28px 32px; display: flex; flex-direction: column; gap: 22px; max-width: 1400px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .page-title { font-size: 1.6rem; font-weight: 800; font-family: var(--font-sora, sans-serif); color: var(--text-primary); margin: 0; }
        .page-subtitle { font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 0; }
        .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-primary { background: #6366F1; color: #fff; } .btn-primary:hover { background: #4F46E5; }

        .attend-grid { display: grid; grid-template-columns: 1fr 320px; gap: 18px; }
        @media (max-width: 900px) { .attend-grid { grid-template-columns: 1fr; } }

        .cal-card { padding: 22px; }
        .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .cal-month { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-sora, sans-serif); }
        .cal-nav { background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); border-radius: 6px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; }
        .cal-dow-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 6px; }
        .cal-dow { text-align: center; font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; padding: 6px 0; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .cal-day { display: flex; align-items: center; justify-content: center; aspect-ratio: 1; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: default; transition: transform 0.15s; }
        .cal-day.today { outline: 2px solid #6366F1; outline-offset: 2px; }
        .cal-legend { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-color); }
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; font-weight: 500; }
        .legend-dot { width: 7px; height: 7px; border-radius: 50%; }

        .stat-card { padding: 20px; }
        .widget-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0 0 14px; }
        .stat-row { display: flex; justify-content: space-around; }
        .stat-item { text-align: center; }
        .stat-val { font-size: 2rem; font-weight: 800; font-family: var(--font-sora, sans-serif); }
        .stat-lbl { font-size: 0.73rem; color: var(--text-muted); margin-top: 2px; }

        .leave-card { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .lb-row { display: flex; flex-direction: column; gap: 5px; }
        .lb-info { display: flex; justify-content: space-between; align-items: center; }
        .lb-type { font-size: 0.83rem; color: var(--text-secondary); }
        .lb-count { font-size: 0.83rem; font-weight: 700; }
        .lb-bar-wrap { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
        .lb-bar { height: 100%; border-radius: 3px; transition: width 0.8s ease; }
        .lb-used { font-size: 0.7rem; color: var(--text-muted); text-align: right; }
      `}</style>
    </div>
  );
}
