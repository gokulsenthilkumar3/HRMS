'use client';
import React, { useState } from 'react';
import { DollarSign, Download, Play, CheckCircle, AlertCircle } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  department: string;
  ctc: number;
  basic: number;
  hra: number;
  pf: number;
  tax: number;
  takeHome: number;
  status: 'processed' | 'pending' | 'hold';
}

const PAYROLL_DATA: Employee[] = [
  { id: 'EMP001', name: 'Priya Sharma',   department: 'Engineering', ctc: 1440000, basic: 72000, hra: 28800, pf: 8640, tax: 15420, takeHome: 75940, status: 'processed' },
  { id: 'EMP002', name: 'Arjun Mehta',    department: 'Sales',       ctc: 780000,  basic: 39000, hra: 15600, pf: 4680, tax: 4200,  takeHome: 46520, status: 'pending' },
  { id: 'EMP003', name: 'Kavitha R.',     department: 'HR & Admin',  ctc: 1080000, basic: 54000, hra: 21600, pf: 6480, tax: 9200,  takeHome: 59720, status: 'processed' },
  { id: 'EMP004', name: 'Rahul Nair',     department: 'Finance',     ctc: 660000,  basic: 33000, hra: 13200, pf: 3960, tax: 2800,  takeHome: 39440, status: 'hold' },
  { id: 'EMP005', name: 'Divya Krishnan', department: 'Design',      ctc: 960000,  basic: 48000, hra: 19200, pf: 5760, tax: 6900,  takeHome: 54540, status: 'pending' },
];

const STATUS_META = {
  processed: { label: 'Processed', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  pending:   { label: 'Pending',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  hold:      { label: 'On Hold',   color: '#F43F5E', bg: 'rgba(244,63,94,0.1)' },
};

const TAX_SLABS_FY26 = [
  { range: '₹0 – 4 Lakh',       rate: '0%',  tax: 0 },
  { range: '₹4 – 8 Lakh',       rate: '5%',  tax: 20000 },
  { range: '₹8 – 12 Lakh',      rate: '10%', tax: 40000 },
  { range: '₹12 – 16 Lakh',     rate: '15%', tax: 60000 },
  { range: '₹16 – 20 Lakh',     rate: '20%', tax: 80000 },
  { range: '₹20 – 24 Lakh',     rate: '25%', tax: 100000 },
  { range: 'Above ₹24 Lakh',    rate: '30%', tax: null },
];

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function PayrollPage() {
  const [runConfirm, setRunConfirm] = useState(false);
  const [ran, setRan] = useState(false);

  const totalGross = PAYROLL_DATA.reduce((s, e) => s + e.basic + e.hra, 0);
  const totalTakeHome = PAYROLL_DATA.reduce((s, e) => s + e.takeHome, 0);
  const totalTax = PAYROLL_DATA.reduce((s, e) => s + e.tax, 0);

  const handleRun = () => {
    setRunConfirm(false);
    setRan(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">June 2026 · {PAYROLL_DATA.length} employees</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary"><Download size={15} /> Export</button>
          {!ran ? (
            <button className="btn btn-primary" onClick={() => setRunConfirm(true)}>
              <Play size={15} /> Process Payrun
            </button>
          ) : (
            <span className="badge-success"><CheckCircle size={14} /> Payrun Processed</span>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="pay-kpi-row">
        <div className="pay-kpi card-premium">
          <div className="pay-kpi-label">Gross Payroll</div>
          <div className="pay-kpi-value">{fmt(totalGross)}</div>
        </div>
        <div className="pay-kpi card-premium">
          <div className="pay-kpi-label">Net Take-Home</div>
          <div className="pay-kpi-value">{fmt(totalTakeHome)}</div>
        </div>
        <div className="pay-kpi card-premium">
          <div className="pay-kpi-label">Total TDS</div>
          <div className="pay-kpi-value">{fmt(totalTax)}</div>
        </div>
        <div className="pay-kpi card-premium">
          <div className="pay-kpi-label">PF Contribution</div>
          <div className="pay-kpi-value">{fmt(PAYROLL_DATA.reduce((s, e) => s + e.pf, 0))}</div>
        </div>
      </div>

      {/* Payroll table */}
      <div className="card-premium table-wrap">
        <table className="pay-table">
          <thead>
            <tr>
              <th>Employee</th><th>Department</th><th>Basic</th><th>HRA</th>
              <th>PF (Emp.)</th><th>TDS</th><th>Take-Home</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {PAYROLL_DATA.map((e) => {
              const meta = STATUS_META[e.status];
              return (
                <tr key={e.id} className="pay-row">
                  <td><div className="emp-name">{e.name}</div><div className="emp-id">{e.id}</div></td>
                  <td>{e.department}</td>
                  <td className="font-mono">{fmt(e.basic)}</td>
                  <td className="font-mono">{fmt(e.hra)}</td>
                  <td className="font-mono">{fmt(e.pf)}</td>
                  <td className="font-mono" style={{ color: '#F43F5E' }}>{fmt(e.tax)}</td>
                  <td className="font-mono" style={{ color: '#10B981', fontWeight: 700 }}>{fmt(e.takeHome)}</td>
                  <td>
                    <span className="status-pill" style={{ color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tax slab reference */}
      <div className="card-premium tax-card">
        <h3 className="widget-title">New Tax Regime — FY 2025-26</h3>
        <div className="slab-grid">
          {TAX_SLABS_FY26.map((s) => (
            <div key={s.range} className="slab-item">
              <div className="slab-range">{s.range}</div>
              <div className="slab-rate">{s.rate}</div>
            </div>
          ))}
        </div>
        <p className="slab-note">Standard deduction of ₹75,000 applies. Surcharge of 10% for income above ₹50L, 15% above ₹1Cr.</p>
      </div>

      {/* Confirm modal */}
      {runConfirm && (
        <div className="modal-backdrop" onClick={() => setRunConfirm(false)}>
          <div className="confirm-box card-premium" onClick={(e) => e.stopPropagation()}>
            <AlertCircle size={32} color="#F59E0B" />
            <h3>Process Payrun for June 2026?</h3>
            <p>This will initiate salary disbursement for {PAYROLL_DATA.length} employees totalling <strong>{fmt(totalTakeHome)}</strong>.</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setRunConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRun}>Yes, Process</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-container { padding: 28px 32px; display: flex; flex-direction: column; gap: 22px; max-width: 1400px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .page-title { font-size: 1.6rem; font-weight: 800; font-family: var(--font-sora, sans-serif); color: var(--text-primary); margin: 0; }
        .page-subtitle { font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 0; }
        .header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-primary { background: #6366F1; color: #fff; } .btn-primary:hover { background: #4F46E5; }
        .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-secondary); }
        .btn-ghost { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); }
        .badge-success { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 8px; background: rgba(16,185,129,0.1); color: #10B981; font-size: 0.83rem; font-weight: 700; }

        .pay-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
        .pay-kpi { padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .pay-kpi-label { font-size: 0.78rem; color: var(--text-secondary); }
        .pay-kpi-value { font-size: 1.5rem; font-weight: 800; font-family: var(--font-sora, sans-serif); color: var(--text-primary); }

        .table-wrap { border-radius: 12px; overflow: auto; }
        .pay-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; white-space: nowrap; }
        .pay-table th { background: rgba(255,255,255,0.02); color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--border-color); }
        .pay-table td { padding: 13px 16px; border-bottom: 1px solid rgba(255,255,255,0.03); color: var(--text-secondary); vertical-align: middle; }
        .pay-row:last-child td { border-bottom: none; }
        .emp-name { font-weight: 600; color: var(--text-primary); font-size: 0.875rem; }
        .emp-id { font-size: 0.7rem; color: var(--text-muted); margin-top: 1px; font-family: var(--font-mono, monospace); }
        .font-mono { font-family: var(--font-mono, monospace); }
        .status-pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }

        .tax-card { padding: 22px; }
        .widget-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0 0 14px; }
        .slab-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .slab-item { background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px; min-width: 130px; }
        .slab-range { font-size: 0.78rem; color: var(--text-secondary); }
        .slab-rate { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-top: 3px; font-family: var(--font-sora, sans-serif); }
        .slab-note { font-size: 0.75rem; color: var(--text-muted); margin: 12px 0 0; }

        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(6px); z-index: 1100; display: flex; align-items: center; justify-content: center; }
        .confirm-box { padding: 32px; max-width: 400px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .confirm-box h3 { font-size: 1rem; font-weight: 800; color: var(--text-primary); margin: 0; font-family: var(--font-sora, sans-serif); }
        .confirm-box p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
        .confirm-actions { display: flex; gap: 10px; margin-top: 8px; }
      `}</style>
    </div>
  );
}
