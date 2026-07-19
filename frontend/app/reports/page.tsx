'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { BarChart3, Download, FileText, Users, TrendingUp, DollarSign, Clock } from 'lucide-react';

function exportCSV(filename: string, data: any[]) {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const v = row[h];
    if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
    return v;
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const REPORT_TYPES = [
  { id: 'headcount', label: 'Headcount Report', icon: Users, color: '#6366F1', desc: 'Employee count by department, status, and tenure' },
  { id: 'payroll',   label: 'Payroll Summary',  icon: DollarSign, color: '#10B981', desc: 'Monthly salary, deductions, and net pay breakdown' },
  { id: 'attendance', label: 'Attendance Report', icon: Clock, color: '#F59E0B', desc: 'Attendance, leaves, and WFH patterns' },
  { id: 'attrition', label: 'Attrition Analysis', icon: TrendingUp, color: '#F43F5E', desc: 'Turnover rates, exit reasons, and retention metrics' },
  { id: 'performance', label: 'Performance Report', icon: BarChart3, color: '#8B5CF6', desc: 'Goal completion rates and review scores by team' },
  { id: 'recruitment', label: 'Recruitment Funnel', icon: FileText, color: '#06B6D4', desc: 'Pipeline stages, time-to-hire, and offer acceptance' },
];

export default function ReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => api.get<any>('/dashboard/stats'), staleTime: 60_000 });
  const { data: trends } = useQuery({ queryKey: ['dashboard-trends'], queryFn: () => api.get<any>('/dashboard/trends'), staleTime: 60_000 });

  const handleExport = async (reportId: string, format: 'csv' | 'json') => {
    setExporting(reportId);
    setTimeout(() => {
      let data: any[] = [];
      if (reportId === 'headcount') {
        data = stats?.departmentBreakdown ?? [{ message: 'No data available' }];
      } else if (reportId === 'attrition') {
        data = trends ?? [{ message: 'No data available' }];
      } else {
        data = [{ report: reportId, generatedAt: new Date().toISOString(), message: 'Report data would come from backend' }];
      }
      if (format === 'csv') {
        exportCSV(`${reportId}-report.csv`, Array.isArray(data) ? data : [data]);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${reportId}-report.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      setExporting(null);
    }, 600);
  };

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400 }}>
      <div className="page-header">
        <div>
          <h1><BarChart3 size={24} /> Reports & Analytics</h1>
          <p className="page-subtitle">Generate and export HR analytics reports</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
        {[
          { label: 'Total Headcount', value: stats?.totalHeadcount ?? '—', color: '#6366F1' },
          { label: 'Active Employees', value: stats?.activeEmployees ?? '—', color: '#10B981' },
          { label: 'Attrition Rate', value: stats?.attritionRate ? `${stats.attritionRate}%` : '—', color: '#F43F5E' },
          { label: 'Open Positions', value: stats?.openPositions ?? '—', color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-sora,sans-serif)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Report Cards */}
      <div>
        <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>Available Reports</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {REPORT_TYPES.map(report => (
            <div key={report.id} className="glass" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, transition: 'transform 0.2s,border-color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.borderColor = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: report.color + '18', color: report.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <report.icon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{report.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 3 }}>{report.desc}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                <button
                  onClick={() => handleExport(report.id, 'csv')}
                  disabled={exporting === report.id}
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '8px 12px', justifyContent: 'center' }}
                >
                  <Download size={13} /> {exporting === report.id ? 'Exporting…' : 'Export CSV'}
                </button>
                <button
                  onClick={() => handleExport(report.id, 'json')}
                  disabled={exporting === report.id}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '8px 12px' }}
                >
                  JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Breakdown */}
      {stats?.departmentBreakdown?.length > 0 && (
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>
            Headcount by Department
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.departmentBreakdown.map((d: any) => {
              const pct = Math.round((d.count / (stats.totalHeadcount || 1)) * 100);
              return (
                <div key={d.dept} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 120, fontSize: '0.83rem', color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>{d.dept}</div>
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 5, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)', transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ width: 40, fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{d.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
