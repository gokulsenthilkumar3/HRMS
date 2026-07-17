'use client';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Triangle, Mail, ArrowRight, AlertCircle, Shield, BarChart2, Package } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'admin@company.com',   role: 'Admin',   color: '#f85149' },
  { email: 'manager@company.com', role: 'Manager', color: '#d29922' },
  { email: 'user@company.com',    role: 'User',    color: '#3fb950' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-panel-left">
        <div className="login-brand">
          <Triangle size={28} fill="currentColor" />
          <span>VaultIQ</span>
        </div>
        <div className="login-hero">
          <h1 className="login-hero-title">Enterprise Asset<br />Intelligence</h1>
          <p className="login-hero-sub">Track, manage and audit your entire IT asset lifecycle from a single unified dashboard.</p>
        </div>
        <div className="login-features">
          <div className="login-feature">
            <Package size={18} />
            <span>10+ Asset Types Supported</span>
          </div>
          <div className="login-feature">
            <BarChart2 size={18} />
            <span>Real-time Analytics & Reports</span>
          </div>
          <div className="login-feature">
            <Shield size={18} />
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-panel-right">
        <div className="login-card glass animate-slide-up">
          <div className="login-card-header">
            <h2 className="login-title">Sign in</h2>
            <p className="login-subtitle">Enter your corporate email to continue.</p>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <span className="btn-spinner" />
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="demo-section">
            <p className="demo-label">Demo accounts</p>
            <div className="demo-pills">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  className="demo-pill"
                  onClick={() => setEmail(acc.email)}
                  style={{ borderColor: acc.color + '44', color: acc.color }}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg-primary);
        }
        @media (max-width: 768px) {
          .login-page { grid-template-columns: 1fr; }
          .login-panel-left { display: none; }
        }

        /* ---- Left panel ---- */
        .login-panel-left {
          background: linear-gradient(160deg, #0d1117 0%, #0a0c10 100%);
          border-right: 1px solid var(--border-color);
          padding: 48px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          position: relative;
          overflow: hidden;
        }
        .login-panel-left::before {
          content: '';
          position: absolute;
          top: -120px;
          left: -120px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(88,166,255,0.08), transparent 70%);
          pointer-events: none;
        }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--accent-primary);
        }
        .login-hero-title {
          font-size: 2.4rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.5px;
        }
        .login-hero-sub {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.7;
          margin-top: 12px;
          max-width: 340px;
        }
        .login-features {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: auto;
        }
        .login-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .login-feature svg { color: var(--accent-primary); flex-shrink: 0; }

        /* ---- Right panel ---- */
        .login-panel-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background: var(--bg-primary);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .login-card-header { display: flex; flex-direction: column; gap: 6px; }
        .login-title { font-size: 1.6rem; font-weight: 800; }
        .login-subtitle { color: var(--text-secondary); font-size: 0.88rem; }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: rgba(248,81,73,0.1);
          border: 1px solid rgba(248,81,73,0.3);
          border-radius: 8px;
          color: #ff7b78;
          font-size: 0.85rem;
        }

        .login-form { display: flex; flex-direction: column; gap: 16px; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .input-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-wrapper:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(88,166,255,0.12);
        }
        .input-icon { color: var(--text-muted); flex-shrink: 0; }
        .input-wrapper input {
          background: transparent;
          border: none;
          padding: 12px 0;
          color: var(--text-primary);
          font-size: 0.9rem;
          outline: none;
          width: 100%;
        }
        .login-btn {
          width: 100%;
          padding: 13px;
          font-size: 0.95rem;
          border-radius: 9px;
          justify-content: center;
        }
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        /* ---- Demo accounts ---- */
        .demo-section { display: flex; flex-direction: column; gap: 10px; }
        .demo-label { font-size: 0.75rem; color: var(--text-muted); text-align: center; }
        .demo-pills { display: flex; gap: 8px; justify-content: center; }
        .demo-pill {
          padding: 5px 16px;
          border-radius: 20px;
          border: 1px solid;
          background: transparent;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .demo-pill:hover { opacity: 0.75; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
