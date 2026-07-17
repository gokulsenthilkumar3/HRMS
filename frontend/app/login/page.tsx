'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

// ---------- 3D Particle Globe (Canvas-based, no external lib) ----------
function ParticleGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    let W = 0, H = 0;

    const PARTICLE_COUNT = 180;
    const RADIUS = 160;
    let angle = 0;

    interface Particle { theta: number; phi: number; }
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      theta: Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT),
      phi: Math.PI * (1 + Math.sqrt(5)) * i,
    }));

    function resize() {
      W = canvas!.width  = canvas!.offsetWidth;
      H = canvas!.height = canvas!.offsetHeight;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      angle += 0.004;

      const cosA = Math.cos(angle), sinA = Math.sin(angle);

      const projected = particles.map((p) => {
        const x0 = RADIUS * Math.sin(p.theta) * Math.cos(p.phi);
        const y0 = RADIUS * Math.sin(p.theta) * Math.sin(p.phi);
        const z0 = RADIUS * Math.cos(p.theta);
        // rotate around Y axis
        const x1 = x0 * cosA + z0 * sinA;
        const z1 = -x0 * sinA + z0 * cosA;
        // slight tilt around X
        const tilt = 0.3;
        const y1 = y0 * Math.cos(tilt) - z1 * Math.sin(tilt);
        const z2 = y0 * Math.sin(tilt) + z1 * Math.cos(tilt);
        const scale = (z2 + RADIUS * 1.5) / (RADIUS * 2.5);
        return { sx: cx + x1 * scale, sy: cy + y1 * scale, scale };
      });

      // draw edges between nearby points
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].sx - projected[j].sx;
          const dy = projected[i].sy - projected[j].sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 40) {
            ctx.beginPath();
            ctx.moveTo(projected[i].sx, projected[i].sy);
            ctx.lineTo(projected[j].sx, projected[j].sy);
            ctx.strokeStyle = `rgba(99,102,241,${0.18 * (1 - dist / 40)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // draw dots
      projected.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 1.5 * p.scale + 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${0.5 + 0.5 * p.scale})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="globe-canvas" aria-hidden="true" />;
}

// ---------- validators ----------
function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address';
}
function validatePassword(v: string) {
  if (!v) return 'Password is required';
  if (v.length < 6) return 'Password must be at least 6 characters';
  return '';
}

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [pwdErr, setPwdErr]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [apiErr, setApiErr]     = useState('');

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading]);

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

  const fillDemo = (role: 'admin' | 'manager' | 'user') => {
    const creds = {
      admin:   { email: 'admin@company.com',       password: 'password123' },
      manager: { email: 'manager@company.com',     password: 'Manager@2026' },
      user:    { email: 'emp001@company.com',       password: 'Emp@001' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
    setEmailErr(''); setPwdErr(''); setApiErr('');
  };

  return (
    <div className="login-bg">
      {/* 3D Globe */}
      <div className="globe-wrap"><ParticleGlobe /></div>

      {/* Gradient Orbs */}
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />

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

        {/* Quick-fill demo pills */}
        <div className="demo-pills">
          <span className="demo-label">Quick fill:</span>
          <button type="button" className="pill pill-admin"   onClick={() => fillDemo('admin')}>Admin</button>
          <button type="button" className="pill pill-manager" onClick={() => fillDemo('manager')}>Manager</button>
          <button type="button" className="pill pill-user"    onClick={() => fillDemo('user')}>Employee</button>
        </div>

        {apiErr && (
          <div className="api-error">
            <AlertCircle size={14} /> {apiErr}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Work Email</label>
            <input
              id="email" type="email" placeholder="you@company.com"
              autoComplete="email" value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(''); }}
              className={emailErr ? 'input-error' : ''}
            />
            {emailErr && <span className="field-error">{emailErr}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="pwd-wrap">
              <input
                id="password" type={showPwd ? 'text' : 'password'}
                placeholder="Your password" autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (pwdErr) setPwdErr(''); }}
                className={pwdErr ? 'input-error' : ''}
              />
              <button type="button" className="pwd-toggle" onClick={() => setShowPwd((s) => !s)} aria-label={showPwd ? 'Hide' : 'Show'}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwdErr && <span className="field-error">{pwdErr}</span>}
          </div>

          <div className="forgot-row">
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <><Loader2 size={17} className="spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">⚡ Protected by enterprise-grade security &middot; ISO 27001</p>
      </div>

      <style>{`
        .login-bg {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #0A0B0F; position: relative; overflow: hidden; padding: 20px;
        }
        .globe-wrap {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          pointer-events: none; z-index: 0;
        }
        .globe-canvas { width: 100%; height: 100%; opacity: 0.55; }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.18; pointer-events: none; animation: orbFloat linear infinite; }
        .orb-1 { width: 500px; height: 500px; background: #6366F1; top: -150px; left: -100px; animation-duration: 20s; }
        .orb-2 { width: 350px; height: 350px; background: #8B5CF6; bottom: -100px; right: -80px; animation-duration: 15s; animation-delay: -7s; }
        @keyframes orbFloat {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(25px,-20px) scale(1.04); }
          66%  { transform: translate(-15px,20px) scale(0.97); }
          100% { transform: translate(0,0) scale(1); }
        }

        .login-card {
          position: relative; z-index: 1; width: 100%; max-width: 420px;
          background: rgba(255,255,255,0.035); backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
          padding: 40px 36px; display: flex; flex-direction: column; gap: 16px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5); animation: slideUp 0.45s ease;
        }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand-icon { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg,#6366F1,#8B5CF6); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 900; color: #fff; font-family: var(--font-sora,sans-serif); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
        .brand-name { font-family: var(--font-sora,sans-serif); font-size: 1.05rem; font-weight: 800; color: #F0F2FF; }
        .brand-tagline { font-size: 0.68rem; color: #4B5278; }
        .login-heading { font-family: var(--font-sora,sans-serif); font-size: 1.6rem; font-weight: 800; color: #F0F2FF; margin: 0; }
        .login-sub { font-size: 0.85rem; color: #9BA3C0; margin: -8px 0 0; }

        .demo-pills { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .demo-label { font-size: 0.72rem; color: #4B5278; }
        .pill { padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; border: 1px solid; cursor: pointer; transition: all 0.15s; background: transparent; }
        .pill-admin   { border-color: rgba(244,63,94,0.4);   color: #F43F5E; } .pill-admin:hover   { background: rgba(244,63,94,0.1);   }
        .pill-manager { border-color: rgba(245,158,11,0.4);  color: #F59E0B; } .pill-manager:hover { background: rgba(245,158,11,0.1);  }
        .pill-user    { border-color: rgba(16,185,129,0.4);  color: #10B981; } .pill-user:hover    { background: rgba(16,185,129,0.1);  }

        .api-error { display: flex; align-items: center; gap: 7px; background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.2); color: #F43F5E; border-radius: 10px; padding: 10px 14px; font-size: 0.82rem; }
        .login-form { display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 0.78rem; font-weight: 600; color: #9BA3C0; }
        .field input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 12px 14px; color: #F0F2FF; font-size: 0.9rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%; }
        .field input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .field input.input-error { border-color: #F43F5E !important; }
        .field-error { font-size: 0.72rem; color: #F43F5E; }
        .pwd-wrap { position: relative; }
        .pwd-wrap input { padding-right: 44px; }
        .pwd-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #4B5278; cursor: pointer; display: flex; align-items: center; }
        .forgot-row { display: flex; justify-content: flex-end; margin: -4px 0; }
        .forgot-link { font-size: 0.78rem; color: #818CF8; transition: color 0.2s; } .forgot-link:hover { color: #6366F1; }
        .btn-login { background: linear-gradient(135deg,#6366F1,#8B5CF6); color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s, transform 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; box-shadow: 0 8px 24px rgba(99,102,241,0.3); }
        .btn-login:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .btn-login:active:not(:disabled) { transform: translateY(0); }
        .btn-login:disabled { opacity: 0.55; cursor: not-allowed; }
        .spin { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-footer { font-size: 0.72rem; color: #4B5278; text-align: center; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
