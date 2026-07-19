'use client';
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Users, TrendingDown, Briefcase, UserPlus, Clock, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

const BarChartWidget  = dynamic(() => import('../../components/charts/BarChartWidget'),  { ssr: false, loading: () => <ChartSkeleton /> });
const LineChartWidget = dynamic(() => import('../../components/charts/LineChartWidget'), { ssr: false, loading: () => <ChartSkeleton /> });
const PieChartWidget  = dynamic(() => import('../../components/charts/PieChartWidget'),  { ssr: false, loading: () => <ChartSkeleton /> });

function ChartSkeleton() { return <div className="chart-skeleton" aria-label="Loading chart" />; }

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return val;
}

function KpiCard({ icon: Icon, label, value, sub, color, href }: { icon: any; label: string; value: number; sub?: string; color: string; href?: string }) {
  const display = useCountUp(value);
  const inner = (
    <div className="kpi-card" style={{ cursor: href ? 'pointer' : 'default' }}>
      <div className="kpi-icon" style={{ background: color + '18', color }}><Icon size={20} /></div>
      <div className="kpi-body">
        <div className="kpi-value">{display}{sub}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link>;
  return inner;
}

function KpiSkeleton() {
  return <div className="kpi-card skeleton"><div className="sk-icon" /><div className="sk-body"><div className="sk-val" /><div className="sk-lbl" /></div></div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: sLoad } = useQuery({ queryKey: ['dashboard-stats'],  queryFn: () => api.get<any>('/dashboard/stats'),  staleTime: 60_000 });
  const { data: trends, isLoading: tLoad } = useQuery({ queryKey: ['dashboard-trends'], queryFn: () => api.get<any>('/dashboard/trends'), staleTime: 60_000 });

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">HR Dashboard</h1>
          <p className="dash-sub">Welcome back, {user?.fullName?.split(' ')[0] ?? 'there'} · Real-time people analytics</p>
        </div>
        <div className="dash-actions">
          <Link href="/hr/add" className="btn-primary-sm">+ Add Employee</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {sLoad ? Array(6).fill(0).map((_, i) => <KpiSkeleton key={i} />) : (
          <>
            <KpiCard icon={Users}        label="Total Headcount"      value={stats?.totalHeadcount ?? 0}       color="#6366F1" href="/hr" />
            <KpiCard icon={Activity}     label="Active Employees"     value={stats?.activeEmployees ?? 0}      color="#10B981" href="/hr" />
            <KpiCard icon={TrendingDown} label="Attrition Rate"       value={stats?.attritionRate ?? 0}        color="#F43F5E" sub="%" />
            <KpiCard icon={Briefcase}    label="Open Positions"       value={stats?.openPositions ?? 0}        color="#F59E0B" href="/recruitment" />
            <KpiCard icon={UserPlus}     label="New Hires This Month" value={stats?.newHiresThisMonth ?? 0}   color="#8B5CF6" href="/hr" />
            <KpiCard icon={Clock}        label="Pending Leaves"       value={stats?.pendingLeaveRequests ?? 0} color="#06B6D4" href="/attendance" />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        <div className="chart-card wide">
          <h3 className="chart-title">Headcount Trend (12 Months)</h3>
          {tLoad ? <ChartSkeleton /> : <LineChartWidget data={trends ?? []} dataKey="headcount" xKey="month" color="#6366F1" />}
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Gender Distribution</h3>
          {sLoad ? <ChartSkeleton /> : <PieChartWidget data={stats?.genderDistribution ?? []} />}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="chart-card">
        <h3 className="chart-title">Headcount by Department</h3>
        {sLoad ? <ChartSkeleton /> : <BarChartWidget data={stats?.departmentBreakdown ?? []} xKey="dept" dataKey="count" color="#8B5CF6" />}
      </div>

      <style>{`
        .dash-page { padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; max-width: 1400px; }
        .dash-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .dash-title { font-family: var(--font-sora,sans-serif); font-size: 1.65rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.2; }
        .dash-sub { font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 0; }
        .dash-actions { display: flex; gap: 10px; align-items: center; }
        .btn-primary-sm { background: linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; border:none; border-radius:8px; padding:9px 16px; font-size:0.82rem; font-weight:700; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(99,102,241,0.3); transition:opacity 0.15s,transform 0.15s; }
        .btn-primary-sm:hover { opacity:0.88; transform:translateY(-1px); }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px,1fr)); gap: 16px; }
        .kpi-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 20px; display: flex; align-items: center; gap: 14px; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.25); border-color: var(--border-hover); }
        .kpi-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kpi-value { font-size: 1.55rem; font-weight: 800; font-family: var(--font-sora,sans-serif); color: var(--text-primary); line-height: 1; }
        .kpi-label { font-size: 0.71rem; color: var(--text-secondary); margin-top: 4px; font-weight: 500; }
        .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        @media(max-width:900px){ .charts-row { grid-template-columns: 1fr; } .dash-page { padding: 16px; } .kpi-grid { grid-template-columns: repeat(auto-fill,minmax(150px,1fr)); } }
        .chart-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 22px; }
        .chart-title { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 16px; }
        .chart-skeleton { height: 220px; border-radius: 10px; background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        [data-theme='light'] .chart-skeleton { background: linear-gradient(90deg,#E8EAEF 25%,#F3F4F8 50%,#E8EAEF 75%); background-size:200% 100%; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .kpi-card.skeleton { animation: shimmer 1.4s infinite; background: linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%); background-size: 200% 100%; border: 1px solid var(--border-color); }
        [data-theme='light'] .kpi-card.skeleton { background: linear-gradient(90deg,#E8EAEF 25%,#F3F4F8 50%,#E8EAEF 75%); background-size:200% 100%; }
        .sk-icon { width:42px; height:42px; border-radius:11px; background:rgba(255,255,255,0.06); flex-shrink:0; }
        .sk-body { flex:1; display:flex; flex-direction:column; gap:8px; }
        .sk-val  { height:22px; width:55%; border-radius:6px; background:rgba(255,255,255,0.06); }
        .sk-lbl  { height:10px; width:80%; border-radius:4px; background:rgba(255,255,255,0.04); }
      `}</style>
    </div>
  );
}
