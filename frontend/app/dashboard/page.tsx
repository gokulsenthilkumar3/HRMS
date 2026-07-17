'use client';
import React, { useState, useEffect } from 'react';
import {
  Users, TrendingDown, Briefcase, CalendarOff,
  ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';

// ─ Types
interface KPICard {
  label: string;
  value: number;
  unit?: string;
  change: number; // % change vs last period
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

interface DeptRow {
  name: string;
  count: number;
  percent: number;
  color: string;
}

interface ActivityItem {
  id: string;
  action: string;
  name: string;
  time: string;
  type: 'join' | 'leave' | 'payroll' | 'review' | 'exit';
}

// ─ Skeleton component
function Skeleton({ h = 16, w = '100%', radius = 6 }: { h?: number; w?: number | string; radius?: number }) {
  return (
    <div
      className="skeleton-box"
      style={{ height: h, width: w, borderRadius: radius }}
    />
  );
}

// ─ Count-up hook
function useCountUp(target: number, duration = 1200, loading = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (loading) { setValue(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, loading]);
  return value;
}

function KPIWidget({ card }: { card: KPICard }) {
  const displayVal = useCountUp(card.value, 1000, card.loading);
  const isPositive = card.change >= 0;
  return (
    <div className="kpi-card card-premium">
      <div className="kpi-header">
        <span className="kpi-icon" style={{ background: card.color + '18', color: card.color }}>
          {card.icon}
        </span>
        <span className={`kpi-change ${isPositive ? 'up' : 'down'}`}>
          {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(card.change)}%
        </span>
      </div>
      {card.loading ? (
        <>
          <Skeleton h={32} w={80} />
          <Skeleton h={12} w={120} />
        </>
      ) : (
        <>
          <div className="kpi-value">
            {displayVal}{card.unit}
          </div>
          <div className="kpi-label">{card.label}</div>
        </>
      )}
    </div>
  );
}

const DEPT_DATA: DeptRow[] = [
  { name: 'Engineering', count: 42, percent: 32, color: '#6366F1' },
  { name: 'Sales', count: 28, percent: 21, color: '#10B981' },
  { name: 'Operations', count: 24, percent: 18, color: '#F59E0B' },
  { name: 'HR & Admin', count: 18, percent: 14, color: '#8B5CF6' },
  { name: 'Finance', count: 12, percent: 9, color: '#06B6D4' },
  { name: 'Marketing', count: 8, percent: 6, color: '#F43F5E' },
];

const ACTIVITY: ActivityItem[] = [
  { id: '1', action: 'joined', name: 'Priya Sharma', time: '2h ago', type: 'join' },
  { id: '2', action: 'payroll processed for', name: 'March 2026', time: '5h ago', type: 'payroll' },
  { id: '3', action: 'on leave', name: 'Arjun Mehta', time: '1d ago', type: 'leave' },
  { id: '4', action: 'performance review for', name: 'Q1 2026', time: '2d ago', type: 'review' },
  { id: '5', action: 'offboarded', name: 'Kavitha R.', time: '3d ago', type: 'exit' },
];

const ACTIVITY_COLORS: Record<string, string> = {
  join: '#10B981', leave: '#F59E0B', payroll: '#6366F1',
  review: '#8B5CF6', exit: '#F43F5E',
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  const kpis: KPICard[] = [
    {
      label: 'Total Headcount',
      value: 132,
      change: 4.2,
      icon: <Users size={20} />,
      color: '#6366F1',
      loading,
    },
    {
      label: 'Attrition Rate',
      value: 6,
      unit: '%',
      change: -1.3,
      icon: <TrendingDown size={20} />,
      color: '#F43F5E',
      loading,
    },
    {
      label: 'Open Positions',
      value: 8,
      change: 2,
      icon: <Briefcase size={20} />,
      color: '#10B981',
      loading,
    },
    {
      label: 'On Leave Today',
      value: 11,
      change: -2,
      icon: <CalendarOff size={20} />,
      color: '#F59E0B',
      loading,
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">People operations overview — real-time HR metrics</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1200); }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        {kpis.map((k) => <KPIWidget key={k.label} card={k} />)}
      </div>

      {/* Mid row: dept table + activity */}
      <div className="dashboard-mid">
        {/* Department breakdown */}
        <div className="card-premium dept-card">
          <h3 className="widget-title">Headcount by Department</h3>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <Skeleton h={12} w={`${60 + i * 5}%`} />
                <div style={{ marginTop: 6 }}><Skeleton h={8} w="100%" radius={4} /></div>
              </div>
            ))
          ) : (
            <table className="dept-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Headcount</th>
                  <th style={{ width: '40%' }}>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {DEPT_DATA.map((d) => (
                  <tr key={d.name}>
                    <td><span className="dept-dot" style={{ background: d.color }} />{d.name}</td>
                    <td className="font-mono">{d.count}</td>
                    <td>
                      <div className="bar-wrap">
                        <div
                          className="bar-fill"
                          style={{ width: `${d.percent}%`, background: d.color }}
                        />
                        <span className="bar-pct">{d.percent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Activity feed */}
        <div className="card-premium activity-card">
          <h3 className="widget-title">Recent Activity</h3>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="activity-skeleton">
                <Skeleton h={32} w={32} radius={50} />
                <div style={{ flex: 1 }}>
                  <Skeleton h={12} w="80%" />
                  <div style={{ marginTop: 5 }}><Skeleton h={10} w="50%" /></div>
                </div>
              </div>
            ))
          ) : (
            <ul className="activity-list">
              {ACTIVITY.map((a) => (
                <li key={a.id} className="activity-item">
                  <div
                    className="activity-dot"
                    style={{ background: ACTIVITY_COLORS[a.type] }}
                  />
                  <div className="activity-body">
                    <span className="activity-text">
                      <strong>{a.name}</strong> {a.action}
                    </span>
                    <span className="activity-time">{a.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <style>{`
        .page-container { padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; max-width: 1400px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .page-title { font-size: 1.6rem; font-weight: 800; font-family: var(--font-sora, sans-serif); color: var(--text-primary); margin: 0; }
        .page-subtitle { font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 0; }
        .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-secondary); }
        .btn-secondary:hover { background: rgba(255,255,255,0.09); color: var(--text-primary); }

        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
        .kpi-card { padding: 22px; display: flex; flex-direction: column; gap: 10px; }
        .kpi-header { display: flex; justify-content: space-between; align-items: center; }
        .kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .kpi-change { display: flex; align-items: center; gap: 3px; font-size: 0.78rem; font-weight: 700; border-radius: 20px; padding: 3px 8px; }
        .kpi-change.up { background: rgba(16,185,129,0.1); color: #10B981; }
        .kpi-change.down { background: rgba(244,63,94,0.1); color: #F43F5E; }
        .kpi-value { font-size: 2rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-sora, sans-serif); line-height: 1; }
        .kpi-label { font-size: 0.8rem; color: var(--text-secondary); }

        .dashboard-mid { display: grid; grid-template-columns: 1fr 320px; gap: 18px; }
        @media (max-width: 900px) { .dashboard-mid { grid-template-columns: 1fr; } }
        .dept-card { padding: 22px; }
        .activity-card { padding: 22px; }
        .widget-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0 0 16px; }

        .dept-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
        .dept-table th { color: var(--text-muted); font-weight: 600; text-align: left; padding: 0 0 10px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); }
        .dept-table td { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); color: var(--text-secondary); vertical-align: middle; }
        .dept-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
        .bar-wrap { display: flex; align-items: center; gap: 8px; }
        .bar-fill { height: 6px; border-radius: 3px; transition: width 0.8s ease; }
        .bar-pct { font-size: 0.72rem; color: var(--text-muted); min-width: 32px; }
        .font-mono { font-family: var(--font-mono, monospace); font-size: 0.88rem; color: var(--text-primary); font-weight: 600; }

        .activity-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0; }
        .activity-item { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .activity-item:last-child { border-bottom: none; }
        .activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .activity-body { display: flex; flex-direction: column; gap: 2px; }
        .activity-text { font-size: 0.83rem; color: var(--text-secondary); }
        .activity-text strong { color: var(--text-primary); }
        .activity-time { font-size: 0.72rem; color: var(--text-muted); }
        .activity-skeleton { display: flex; gap: 12px; align-items: center; padding: 8px 0; }
      `}</style>
    </div>
  );
}
