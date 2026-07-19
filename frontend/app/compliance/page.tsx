'use client';
import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, FileText, Clock, Eye, Download } from 'lucide-react';

type PolicyStatus = 'active' | 'draft' | 'review' | 'archived';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface Policy {
  id: string; title: string; category: string;
  status: PolicyStatus; lastUpdated: string; version: string;
  acknowledgements: number; total: number;
}
interface RiskItem {
  id: string; title: string; category: string; risk: RiskLevel;
  dueDate: string; owner: string; status: 'open' | 'mitigated' | 'closed';
}

const POLICIES: Policy[] = [
  { id: '1', title: 'Code of Conduct', category: 'HR', status: 'active', lastUpdated: '2026-03-01', version: '2.1', acknowledgements: 138, total: 142 },
  { id: '2', title: 'Data Privacy Policy (GDPR)', category: 'Legal', status: 'active', lastUpdated: '2026-01-15', version: '3.0', acknowledgements: 120, total: 142 },
  { id: '3', title: 'Remote Work Policy', category: 'HR', status: 'active', lastUpdated: '2025-11-20', version: '1.4', acknowledgements: 98, total: 142 },
  { id: '4', title: 'Information Security Policy', category: 'IT', status: 'review', lastUpdated: '2026-06-01', version: '2.0-draft', acknowledgements: 0, total: 142 },
  { id: '5', title: 'Anti-Harassment Policy', category: 'HR', status: 'active', lastUpdated: '2025-09-10', version: '1.2', acknowledgements: 140, total: 142 },
  { id: '6', title: 'Expense Reimbursement Policy', category: 'Finance', status: 'draft', lastUpdated: '2026-07-01', version: '1.0-draft', acknowledgements: 0, total: 142 },
];

const RISKS: RiskItem[] = [
  { id: '1', title: 'Unpatched software systems', category: 'IT Security', risk: 'critical', dueDate: '2026-07-30', owner: 'Vikram Singh', status: 'open' },
  { id: '2', title: 'Employee data breach exposure', category: 'Data Privacy', risk: 'high', dueDate: '2026-08-15', owner: 'Meena Iyer', status: 'open' },
  { id: '3', title: 'Non-compliance with POSH Act', category: 'Legal', risk: 'high', dueDate: '2026-07-25', owner: 'Kavitha R.', status: 'mitigated' },
  { id: '4', title: 'Outdated employment contracts', category: 'Legal', risk: 'medium', dueDate: '2026-09-01', owner: 'Divya Krishnan', status: 'open' },
  { id: '5', title: 'PF/ESI non-compliance', category: 'Finance', risk: 'medium', dueDate: '2026-08-01', owner: 'Rahul Nair', status: 'closed' },
];

const POLICY_STATUS: Record<PolicyStatus, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',    color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  draft:    { label: 'Draft',     color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  review:   { label: 'In Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  archived: { label: 'Archived',  color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
};

const RISK_META: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low',      color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  medium:   { label: 'Medium',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  high:     { label: 'High',     color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
  critical: { label: 'Critical', color: '#F43F5E', bg: 'rgba(244,63,94,0.1)' },
};

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, color, background: bg }}>{label}</span>;
}

export default function CompliancePage() {
  const [tab, setTab] = useState<'policies' | 'risks'>('policies');

  const openRisks = RISKS.filter(r => r.status === 'open').length;
  const activePolicies = POLICIES.filter(p => p.status === 'active').length;
  const pendingAck = POLICIES.filter(p => p.acknowledgements < p.total).reduce((acc, p) => acc + (p.total - p.acknowledgements), 0);

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400 }}>
      <div className="page-header">
        <div>
          <h1><ShieldCheck size={24} /> Compliance & Policies</h1>
          <p className="page-subtitle">Manage policies, risk register, and audit trails</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary"><FileText size={15} /> New Policy</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
        {[
          { label: 'Active Policies', value: activePolicies, icon: CheckCircle, color: '#10B981' },
          { label: 'Pending Acknowledgements', value: pendingAck, icon: Clock, color: '#F59E0B' },
          { label: 'Open Risks', value: openRisks, icon: AlertTriangle, color: '#F43F5E' },
          { label: 'Policies in Review', value: POLICIES.filter(p => p.status === 'review').length, icon: Eye, color: '#6366F1' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: s.color + '18', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-start' }}>
        {(['policies', 'risks'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 20px', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer',
            border: 'none', background: tab === t ? '#6366F1' : 'transparent',
            color: tab === t ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s', fontFamily: 'inherit',
          }}>{t === 'policies' ? 'Policy Library' : 'Risk Register'}</button>
        ))}
      </div>

      {tab === 'policies' ? (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Policy', 'Category', 'Version', 'Status', 'Acknowledgements', 'Last Updated', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {POLICIES.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                >
                  <td style={{ padding: '13px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>{p.title}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{p.category}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>v{p.version}</td>
                  <td style={{ padding: '13px 16px' }}><Pill {...POLICY_STATUS[p.status]} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', minWidth: 60 }}>
                        <div style={{ width: `${(p.acknowledgements/p.total)*100}%`, height: '100%', borderRadius: 3, background: p.acknowledgements === p.total ? '#10B981' : '#6366F1' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.acknowledgements}/{p.total}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.lastUpdated}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }} title="Download">
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Risk', 'Category', 'Level', 'Status', 'Owner', 'Due Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISKS.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                >
                  <td style={{ padding: '13px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>{r.title}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{r.category}</td>
                  <td style={{ padding: '13px 16px' }}><Pill {...RISK_META[r.risk]} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <Pill
                      label={r.status === 'open' ? 'Open' : r.status === 'mitigated' ? 'Mitigated' : 'Closed'}
                      color={r.status === 'open' ? '#F43F5E' : r.status === 'mitigated' ? '#F59E0B' : '#10B981'}
                      bg={r.status === 'open' ? 'rgba(244,63,94,0.1)' : r.status === 'mitigated' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'}
                    />
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{r.owner}</td>
                  <td style={{ padding: '13px 16px', color: r.status === 'open' && new Date(r.dueDate) < new Date() ? '#F43F5E' : 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{r.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
