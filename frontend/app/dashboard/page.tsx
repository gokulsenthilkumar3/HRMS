'use client';
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Users, TrendingDown, Briefcase, UserPlus, Clock, Activity } from 'lucide-react';

const BarChartWidget   = dynamic(() => import('../../components/charts/BarChartWidget'),   { ssr: false, loading: () => <ChartSkeleton /> });
const LineChartWidget  = dynamic(() => import('../../components/charts/LineChartWidget'),  { ssr: false, loading: () => <ChartSkeleton /> });
const PieChartWidget   = dynamic(() => import('../../components/charts/PieChartWidget'),   { ssr: false, loading: () => <ChartSkeleton /> });
const DashboardGlobe3D = dynamic(() => import('../../components/3d/DashboardGlobe3D'),     { ssr: false, loading: () => <div className="globe-placeholder" /> });

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

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number; sub?: string; color: string }) {
  const display = useCountUp(value);
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: color + '18', color }}><Icon size={20} /></div>
      <div className="kpi-body">
        <div className="kpi-value">{display}{sub}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return <div className="kpi-card skeleton"><div className="sk-icon" /><div className="sk-body"><div className="sk-val" /><div className="sk-lbl" /></div></div>;
}

export default function DashboardPage() {
  const { data: stats, isLoading: sLoad } = useQuery({ queryKey: ['dashboard-stats'],  queryFn: () => api.get<any>('/dashboard/stats'),  staleTime: 60_000 });
  const { data: trends, isLoading: tLoad } = useQuery({ queryKey: ['dashboard-trends'], queryFn: () => api.get<any>('/dashboard/trends'), staleTime: 60_000 });

  return (
    <div className="dash">
      {/* 3D Globe hero */}
      <div className="globe-wrap"><Suspense fallback={<div className="globe-placeholder" />}><DashboardGlobe3D /></Suspense></div>

      <div className="dash-content">
        <div className="dash-header">
          <h1 className="dash-title">HR Dashboard</h1>
          <p className="dash-sub">Real-time people analytics for your organisation</p>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          {sLoad ? Array(6).fill(0).map((_, i) => <KpiSkeleton key={i} />) : (
            <>
              <KpiCard icon={Users}        label="Total Headcount"      value={stats?.totalHeadcount ?? 0}      color="#6366F1" />
              <KpiCard icon={Activity}     label="Active Employees"     value={stats?.activeEmployees ?? 0}     color="#10B981" />
              <KpiCard icon={TrendingDown} label="Attrition Rate"       value={stats?.attritionRate ?? 0}       color="#F43F5E" sub="%" />
              <KpiCard icon={Briefcase}    label="Open Positions"       value={stats?.openPositions ?? 0}       color="#F59E0B" />
              <KpiCard icon={UserPlus}     label="New Hires This Month" value={stats?.newHiresThisMonth ?? 0}  color="#8B5CF6" />
              <KpiCard icon={Clock}        label="Pending Leaves"       value={stats?.pendingLeaveRequests ?? 0} color="#06B6D4" />
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
      </div>

      <style>{`
        .dash { position: relative; min-height: 100vh; background: var(--bg-primary,#0A0B0F); }
        .globe-wrap { position: fixed; top: 0; right: 0; width: 420px; height: 420px; pointer-events: none; z-index: 0; opacity: 0.18; }
        .globe-placeholder { width: 100%; height: 100%; }
        .dash-content { position: relative; z-index: 1; padding: 32px; display: flex; flex-direction: column; gap: 24px; max-width: 1280px; }
        .dash-header h1 { font-family: var(--font-sora,sans-serif); font-size: 1.8rem; font-weight: 800; color: #F0F2FF; margin: 0; }
        .dash-header p  { font-size: 0.85rem; color: #9BA3C0; margin: 4px 0 0; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 16px; }
        .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 14px; transition: transform 0.2s, box-shadow 0.2s; }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .kpi-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kpi-value { font-size: 1.6rem; font-weight: 800; font-family: var(--font-sora,sans-serif); color: #F0F2FF; line-height: 1; }
        .kpi-label { font-size: 0.72rem; color: #9BA3C0; margin-top: 4px; font-weight: 500; }
        .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        @media(max-width:768px){ .charts-row { grid-template-columns: 1fr; } .dash-content { padding: 16px; } }
        .chart-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 22px; }
        .chart-title { font-size: 0.88rem; font-weight: 700; color: #9BA3C0; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px; }
        .chart-skeleton { height: 220px; border-radius: 10px; background: linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .kpi-card.skeleton { animation: shimmer 1.4s infinite; background: linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%); background-size: 200% 100%; }
        .sk-icon { width:44px; height:44px; border-radius:12px; background:rgba(255,255,255,0.06); flex-shrink:0; }
        .sk-body { flex:1; display:flex; flex-direction:column; gap:8px; }
        .sk-val  { height:24px; width:60%; border-radius:6px; background:rgba(255,255,255,0.06); }
        .sk-lbl  { height:12px; width:80%; border-radius:4px; background:rgba(255,255,255,0.04); }
      `}</style>
    </div>
  );
}
