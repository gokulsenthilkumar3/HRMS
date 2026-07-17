'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { DollarSign, Download, CheckCircle, FileText, TrendingUp } from 'lucide-react';

function TaxComparison({ tax }: { tax: any }) {
  if (!tax) return null;
  return (
    <div className="tax-comp">
      <h4>Tax Regime Comparison</h4>
      <div className="tax-grid">
        <div className={`tax-card ${tax.recommended==='NEW'?'recommended':''}`}>
          <div className="tax-regime">New Regime {tax.recommended==='NEW'&&<span className="rec-badge">Recommended</span>}</div>
          <div className="tax-annual">₹{tax.newRegime.annualTax.toLocaleString('en-IN')}/yr</div>
          <div className="tax-monthly">₹{tax.newRegime.monthlyTax.toLocaleString('en-IN')}/mo TDS</div>
        </div>
        <div className={`tax-card ${tax.recommended==='OLD'?'recommended':''}`}>
          <div className="tax-regime">Old Regime {tax.recommended==='OLD'&&<span className="rec-badge">Recommended</span>}</div>
          <div className="tax-annual">₹{tax.oldRegime.annualTax.toLocaleString('en-IN')}/yr</div>
          <div className="tax-monthly">₹{tax.oldRegime.monthlyTax.toLocaleString('en-IN')}/mo TDS</div>
        </div>
      </div>
      <p className="tax-saving">💡 You save <strong>₹{tax.saving.toLocaleString('en-IN')}</strong> with the {tax.recommended} regime</p>
    </div>
  );
}

function PayslipCard({ p }: { p: any }) {
  return (
    <div className="payslip-card">
      <div className="ps-header">
        <div><div className="ps-period">{p.period}</div><div className="ps-status" data-status={p.status}>{p.status}</div></div>
        <div className="ps-net">₹{p.netAmount?.toLocaleString('en-IN')}</div>
      </div>
      <div className="ps-breakdown">
        <div className="ps-row"><span>Basic</span><span>₹{p.basicSalary?.toLocaleString('en-IN')}</span></div>
        <div className="ps-row"><span>HRA</span><span>₹{p.hra?.toLocaleString('en-IN')}</span></div>
        <div className="ps-row"><span>Allowances</span><span>₹{p.allowances?.toLocaleString('en-IN')}</span></div>
        <div className="ps-row deduct"><span>Deductions (PF+ESI+PT)</span><span>-₹{p.deductions?.toLocaleString('en-IN')}</span></div>
        <div className="ps-row deduct"><span>Tax (TDS)</span><span>-₹{p.taxAmount?.toLocaleString('en-IN')}</span></div>
        <div className="ps-row total"><span>Net Pay</span><span>₹{p.netAmount?.toLocaleString('en-IN')}</span></div>
      </div>
      <button className="ps-dl" onClick={()=>alert('PDF download — integrate @react-pdf/renderer')}><Download size={13}/> Download PDF</button>
    </div>
  );
}

export default function PayrollPage() {
  const [basic, setBasic] = useState(80000);
  const { data:payslips=[], isLoading } = useQuery({ queryKey:['my-payslips'], queryFn:()=>api.get<any[]>('/payroll/my'), staleTime:60_000 });
  const calc = useMutation({ mutationFn:(b:number)=>api.post<any>('/payroll/calculate',{basicSalary:b}) });

  return (
    <div className="pay-page">
      <h1><DollarSign size={22}/> Payroll &amp; Salary</h1>

      {/* Salary Calculator */}
      <div className="calc-card">
        <h3><TrendingUp size={16}/> Salary &amp; Tax Calculator</h3>
        <div className="calc-row">
          <div className="field">
            <label>Basic Salary (₹/month)</label>
            <input type="number" value={basic} min={10000} step={1000} onChange={e=>setBasic(+e.target.value)}/>
          </div>
          <button className="btn-calc" onClick={()=>calc.mutate(basic)} disabled={calc.isPending}>Calculate</button>
        </div>
        {calc.data&&(
          <>
            <div className="salary-breakdown">
              {[['Basic',calc.data.salary.basic],['HRA',calc.data.salary.hra],['DA',calc.data.salary.da],['TA',calc.data.salary.ta],['Special',calc.data.salary.special]].map(([l,v])=>(
                <div key={l} className="sb-row"><span>{l}</span><span>₹{Number(v).toLocaleString('en-IN')}</span></div>
              ))}
              <div className="sb-row gross"><span>Gross</span><span>₹{calc.data.salary.gross?.toLocaleString('en-IN')}</span></div>
              <div className="sb-row deduct"><span>PF (12%)</span><span>-₹{calc.data.salary.pf?.toLocaleString('en-IN')}</span></div>
              <div className="sb-row deduct"><span>ESI</span><span>-₹{calc.data.salary.esi?.toLocaleString('en-IN')}</span></div>
              <div className="sb-row deduct"><span>PT</span><span>-₹{calc.data.salary.pt?.toLocaleString('en-IN')}</span></div>
            </div>
            <TaxComparison tax={calc.data.tax}/>
          </>
        )}
      </div>

      {/* Payslips */}
      <h3 className="section-h">My Payslips</h3>
      {isLoading ? <div className="skeleton-list">{Array(3).fill(0).map((_,i)=><div key={i} className="payslip-skeleton"/>)}</div>
        : payslips.length===0 ? <div className="empty">No payslips found</div>
        : <div className="payslips-grid">{payslips.map(p=><PayslipCard key={p.id} p={p}/>)}</div>}

      <style>{payStyles}</style>
    </div>
  );
}

const payStyles=`
.pay-page{padding:28px 32px;display:flex;flex-direction:column;gap:24px;max-width:960px;}
.pay-page h1{display:flex;align-items:center;gap:10px;font-family:var(--font-sora,sans-serif);font-size:1.5rem;font-weight:800;color:#F0F2FF;margin:0;}
.section-h{font-size:0.9rem;font-weight:700;color:#9BA3C0;text-transform:uppercase;letter-spacing:0.06em;margin:0;}
.calc-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:18px;}
.calc-card h3{display:flex;align-items:center;gap:8px;font-size:0.95rem;font-weight:700;color:#F0F2FF;margin:0;}
.calc-row{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;}
.field{display:flex;flex-direction:column;gap:6px;} .field label{font-size:0.78rem;font-weight:600;color:#9BA3C0;}
.field input{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:9px;padding:10px 14px;color:#F0F2FF;font-size:0.88rem;outline:none;width:200px;}
.btn-calc{background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;border:none;border-radius:10px;padding:11px 22px;font-size:0.85rem;font-weight:700;cursor:pointer;height:40px;align-self:flex-end;}
.salary-breakdown{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;}
.sb-row{display:flex;justify-content:space-between;background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 12px;font-size:0.82rem;color:#9BA3C0;}
.sb-row span:last-child{color:#F0F2FF;font-weight:700;} .sb-row.gross{background:rgba(99,102,241,0.08);color:#818CF8;} .sb-row.deduct{color:#F43F5E;} .sb-row.deduct span:last-child{color:#F43F5E;}
.tax-comp{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;}
.tax-comp h4{font-size:0.82rem;font-weight:700;color:#9BA3C0;text-transform:uppercase;letter-spacing:0.05em;margin:0;}
.tax-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.tax-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:4px;}
.tax-card.recommended{border-color:rgba(99,102,241,0.3);background:rgba(99,102,241,0.06);}
.tax-regime{font-size:0.78rem;font-weight:700;color:#9BA3C0;display:flex;align-items:center;gap:8px;}
.rec-badge{background:#6366F1;color:#fff;font-size:0.6rem;padding:2px 7px;border-radius:20px;}
.tax-annual{font-size:1.1rem;font-weight:800;color:#F0F2FF;font-family:var(--font-sora,sans-serif);}
.tax-monthly{font-size:0.72rem;color:#9BA3C0;}
.tax-saving{font-size:0.8rem;color:#9BA3C0;margin:0;}
.payslips-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;}
.payslip-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px;}
.ps-header{display:flex;justify-content:space-between;align-items:flex-start;}
.ps-period{font-size:0.82rem;font-weight:700;color:#F0F2FF;}
.ps-status{font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:20px;margin-top:4px;width:fit-content;}
.ps-status[data-status='PAID']{background:rgba(16,185,129,0.1);color:#10B981;}
.ps-status[data-status='DRAFT']{background:rgba(245,158,11,0.1);color:#F59E0B;}
.ps-net{font-size:1.3rem;font-weight:800;color:#10B981;font-family:var(--font-sora,sans-serif);}
.ps-breakdown{display:flex;flex-direction:column;gap:6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;}
.ps-row{display:flex;justify-content:space-between;font-size:0.78rem;color:#9BA3C0;}
.ps-row span:last-child{color:#F0F2FF;font-weight:600;} .ps-row.deduct span:last-child{color:#F43F5E;} .ps-row.total{font-weight:800;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px;} .ps-row.total span{color:#10B981;font-size:0.88rem;}
.ps-dl{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:#9BA3C0;border-radius:8px;padding:8px 14px;font-size:0.78rem;cursor:pointer;transition:all 0.15s;} .ps-dl:hover{background:rgba(255,255,255,0.07);color:#F0F2FF;}
.payslip-skeleton{height:180px;border-radius:14px;background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.empty{color:#4B5278;font-size:0.85rem;text-align:center;padding:40px;}
.skeleton-list{display:flex;flex-direction:column;gap:12px;}
`;
