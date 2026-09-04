'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', department: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    try { await signup(form.email, form.password, form.fullName, form.department); }
    catch (err: any) { setError(err?.message || 'Unable to create your account.'); }
    finally { setLoading(false); }
  };

  return (
    <main className="signup-page">
      <div className="signup-glow signup-glow-one" /><div className="signup-glow signup-glow-two" />
      <section className="signup-card">
        <Link href="/login" className="back-link"><ArrowLeft size={15} /> Back to sign in</Link>
        <div className="signup-brand"><span className="signup-icon"><UserPlus size={18} /></span><div><strong>HRMS</strong><small>People Operations Platform</small></div></div>
        <div><h1>Create your account</h1><p>Join your team workspace in a few seconds.</p></div>
        {error && <div className="signup-error" role="alert"><AlertCircle size={15} />{error}</div>}
        <form onSubmit={submit} className="signup-form">
          <label>Full name<input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Your name" autoComplete="name" /></label>
          <label>Work email<input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@company.com" autoComplete="email" /></label>
          <label>Department <span>(optional)</span><input value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="e.g. Engineering" /></label>
          <div className="signup-grid"><label>Password<input required type="password" minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="8+ characters" autoComplete="new-password" /></label><label>Confirm password<input required type="password" minLength={8} value={form.confirm} onChange={(e) => update('confirm', e.target.value)} placeholder="Repeat password" autoComplete="new-password" /></label></div>
          <button className="signup-submit" disabled={loading}>{loading ? <><Loader2 size={16} className="spin" /> Creating account…</> : 'Create account'}</button>
        </form>
        <small className="signup-note">Your account will be created with standard employee access.</small>
      </section>
      <style>{`
        .signup-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#080a0f;position:relative;overflow:hidden;color:#f0f2ff}.signup-glow{position:absolute;border-radius:50%;filter:blur(100px);opacity:.2}.signup-glow-one{width:420px;height:420px;background:#6366f1;top:-180px;left:-120px}.signup-glow-two{width:350px;height:350px;background:#8b5cf6;bottom:-160px;right:-120px}.signup-card{position:relative;width:100%;max-width:500px;padding:30px 34px;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:rgba(20,22,32,.86);backdrop-filter:blur(22px);box-shadow:0 30px 90px rgba(0,0,0,.45);display:flex;flex-direction:column;gap:20px}.back-link{display:inline-flex;align-items:center;gap:6px;color:#8d96b7;font-size:.76rem}.back-link:hover{color:#c7d2fe}.signup-brand{display:flex;align-items:center;gap:10px}.signup-icon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#6366f1,#8b5cf6)}.signup-brand strong{display:block;font-family:var(--font-brand);font-size:1rem}.signup-brand small{display:block;color:#727b9d;font-size:.66rem}.signup-card h1{font:800 1.65rem var(--font-brand);letter-spacing:-.04em;margin:0 0 6px}.signup-card p{color:#9ba3c0;font-size:.84rem;margin:0}.signup-error{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:9px;color:#fda4af;background:rgba(244,63,94,.09);border:1px solid rgba(244,63,94,.25);font-size:.78rem}.signup-form{display:flex;flex-direction:column;gap:14px}.signup-form label{display:flex;flex-direction:column;gap:6px;color:#aeb6d2;font-size:.75rem;font-weight:700}.signup-form label span{color:#697397;font-weight:500}.signup-form input{width:100%;padding:11px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.055);color:#f0f2ff;outline:none;font:400 .84rem var(--font-sans)}.signup-form input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.14)}.signup-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.signup-submit{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;padding:12px;border:0;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 8px 24px rgba(99,102,241,.3)}.signup-submit:disabled{opacity:.6;cursor:not-allowed}.signup-note{text-align:center;color:#697397;font-size:.68rem}@media(max-width:560px){.signup-card{padding:26px 20px;border-radius:18px}.signup-grid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
