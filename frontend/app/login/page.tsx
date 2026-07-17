'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

// Simple client-side email+password validators
function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address';
}
function validatePassword(v: string) {
  if (!v) return 'Password is required';
  if (v.length < 8) return 'Minimum 8 characters';
  return '';
}

// Animated floating orbs (pure CSS, no canvas needed)
function FloatingOrbs() {
  return (
    <div className="orbs-wrapper" aria-hidden="true">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`orb orb-${i + 1}`} />
      ))}
      <style>{`
        .orbs-wrapper { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.25;
          animation: orbFloat linear infinite;
        }
        .orb-1 { width: 400px; height: 400px; background: #6366F1; top: -100px; left: -80px; animation-duration: 18s; }
        .orb-2 { width: 300px; height: 300px; background: #8B5CF6; bottom: -60px; right: -60px; animation-duration: 14s; animation-delay: -5s; }
        .orb-3 { width: 250px; height: 250px; background: #06B6D4; top: 40%; left: 50%; animation-duration: 22s; animation-delay: -9s; }
        .orb-4 { width: 180px; height: 180px; background: #10B981; bottom: 20%; left: 10%; animation-duration: 16s; animation-delay: -3s; }
        .orb-5 { width: 220px; height: 220px; background: #F59E0B; top: 20%; right: 15%; animation-duration: 20s; animation-delay: -12s; }
        @keyframes orbFloat {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(30px, -20px) scale(1.05); }
          50%  { transform: translate(-10px, 30px) scale(0.95); }
          75%  { transform: translate(20px, 10px) scale(1.02); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr] = useState('');

  useEffect(() => { if (user) router.replace('/dashboard'); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr); setPwdErr(pErr);
    if (eErr || pErr) return;

    setLoading(true); setApiErr('');
    try {
      await login(email, password);
    } catch (err: any) {
      setApiErr(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <FloatingOrbs />

      <div className="login-card">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">HR</div>
          <div>
            <div className="brand-name">HRMS</div>
            <div className="brand-tagline">People Operations Platform</div>
          </div>
        </div>

        <h1 className="login-heading">Welcome back</h1>
        <p className="login-sub">Sign in to manage your workforce</p>

        {apiErr && (
          <div className="api-error">
            <ShieldCheck size={14} /> {apiErr}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="field">
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(''); }}
              className={emailErr ? 'input-error' : ''}
            />
            {emailErr && <span className="field-error">{emailErr}</span>}
          </div>

          {/* Password */}
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="pwd-wrap">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Min 8 characters"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (pwdErr) setPwdErr(''); }}
                className={pwdErr ? 'input-error' : ''}
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwdErr && <span className="field-error">{pwdErr}</span>}
          </div>

          <div className="forgot-row">
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <Loader2 size={17} className="spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">Protected by enterprise-grade security · ISO 27001</p>
      </div>

      <style>{`
        .login-bg {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-primary);
          position: relative;
          padding: 20px;
        }
        .login-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 400px;
          background: rgba(255,255,255,0.035);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 40px 36px;
          display: flex; flex-direction: column; gap: 14px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.4);
          animation: slideUp 0.4s ease;
        }
        .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        .brand-icon {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.78rem; font-weight: 900; color: #fff;
          font-family: var(--font-sora, sans-serif);
        }
        .brand-name { font-family: var(--font-sora, sans-serif); font-size: 1.05rem; font-weight: 800; color: var(--text-primary); }
        .brand-tagline { font-size: 0.7rem; color: var(--text-muted); }
        .login-heading { font-family: var(--font-sora, sans-serif); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .login-sub { font-size: 0.85rem; color: var(--text-secondary); margin: -6px 0 4px; }
        .api-error { display: flex; align-items: center; gap: 7px; background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.2); color: #F43F5E; border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; }
        .login-form { display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
        .field input {
          background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
          border-radius: 10px; padding: 11px 14px; color: var(--text-primary);
          font-size: 0.9rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .field input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .field input.input-error { border-color: #F43F5E; }
        .field-error { font-size: 0.72rem; color: #F43F5E; }
        .pwd-wrap { position: relative; }
        .pwd-wrap input { padding-right: 42px; }
        .pwd-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; }
        .forgot-row { display: flex; justify-content: flex-end; margin: -4px 0; }
        .forgot-link { font-size: 0.78rem; color: #818CF8; transition: color 0.2s; }
        .forgot-link:hover { color: #6366F1; }
        .btn-login {
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          color: #fff; border: none; border-radius: 10px;
          padding: 13px; font-size: 0.92rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 4px;
        }
        .btn-login:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
        .spin { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-footer { font-size: 0.72rem; color: var(--text-muted); text-align: center; margin-top: 4px; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
