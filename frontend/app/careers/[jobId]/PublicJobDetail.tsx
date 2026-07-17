'use client';
import React, { useState } from 'react';
import { Briefcase, MapPin, DollarSign, Clock, Send } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function PublicJobDetail({ jobId }: { jobId: string }) {
  const [job, setJob]         = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [applied, setApplied] = React.useState(false);
  const [form, setForm]       = React.useState({ name:'', email:'', phone:'', source:'CAREERS_PAGE' });
  const [error, setError]     = React.useState('');

  React.useEffect(() => {
    fetch(`${API_URL}/recruitment/public/jobs/${jobId}`)
      .then(r=>r.json()).then(setJob).catch(()=>setError('Job not found')).finally(()=>setLoading(false));
  }, [jobId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const r = await fetch(`${API_URL}/recruitment/public/apply/${jobId}`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      setApplied(true);
    } catch(e:any) { setError(e.message); }
  };

  if (loading) return <div className="careers-loading">Loading job details...</div>;
  if (error && !job) return <div className="careers-error">{error}</div>;

  return (
    <div className="careers-page">
      <header className="careers-header">
        <h1>{job.title}</h1>
        <div className="job-meta">
          <span><Briefcase size={14}/> {job.department}</span>
          <span><MapPin size={14}/> {job.location}</span>
          <span><Clock size={14}/> {job.type}</span>
          {job.salaryMin&&<span><DollarSign size={14}/> ₹{job.salaryMin.toLocaleString('en-IN')} – ₹{job.salaryMax?.toLocaleString('en-IN')}</span>}
        </div>
      </header>

      <div className="careers-body">
        <div className="careers-desc"><h3>About this Role</h3><p>{job.description}</p></div>
        {applied ? (
          <div className="apply-success">✅ Application submitted! We'll be in touch soon.</div>
        ) : (
          <form className="apply-form" onSubmit={handleApply}>
            <h3>Apply Now</h3>
            <div className="field"><label>Full Name *</label><input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div className="field"><label>Email *</label><input type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
            {error&&<div className="form-err">{error}</div>}
            <button type="submit" className="btn-apply"><Send size={14}/> Submit Application</button>
          </form>
        )}
      </div>

      <style>{`
        .careers-page{max-width:740px;margin:0 auto;padding:40px 20px;font-family:var(--font-inter,sans-serif);color:#F0F2FF;}
        .careers-header{margin-bottom:28px;} .careers-header h1{font-size:1.8rem;font-weight:800;font-family:var(--font-sora,sans-serif);margin:0 0 12px;}
        .job-meta{display:flex;flex-wrap:wrap;gap:16px;} .job-meta span{display:flex;align-items:center;gap:6px;font-size:0.82rem;color:#9BA3C0;}
        .careers-body{display:grid;grid-template-columns:1fr 360px;gap:32px;align-items:start;}
        @media(max-width:680px){.careers-body{grid-template-columns:1fr;}}
        .careers-desc h3{font-size:0.9rem;font-weight:700;color:#9BA3C0;text-transform:uppercase;margin:0 0 10px;}
        .careers-desc p{font-size:0.88rem;color:#9BA3C0;line-height:1.7;white-space:pre-wrap;}
        .apply-form{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:14px;}
        .apply-form h3{font-size:1rem;font-weight:800;margin:0;}
        .field{display:flex;flex-direction:column;gap:6px;} .field label{font-size:0.78rem;font-weight:600;color:#9BA3C0;}
        .field input{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:9px;padding:10px 12px;color:#F0F2FF;font-size:0.88rem;outline:none;}
        .form-err{color:#F43F5E;font-size:0.8rem;}
        .btn-apply{display:flex;align-items:center;gap:8px;justify-content:center;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;border:none;border-radius:10px;padding:12px;font-size:0.88rem;font-weight:700;cursor:pointer;}
        .apply-success{background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px;color:#10B981;font-size:0.9rem;font-weight:600;}
        .careers-loading,.careers-error{padding:80px;text-align:center;color:#9BA3C0;}
      `}</style>
    </div>
  );
}
