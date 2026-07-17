'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Triangle,
  Shield,
  Zap,
  Brain,
  History,
  Sparkles,
  Globe,
  Activity,
  Check,
  HelpCircle,
} from 'lucide-react';
import LandingHero3D from '../components/LandingHero3D';

export default function RootPage() {
  return (
    <div className="landing-container blueprint-grid">
      {/* Top Navbar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        zIndex: 100,
        background: 'rgba(10, 12, 16, 0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
          <Triangle size={24} fill="currentColor" />
          <span>VaultIQ</span>
        </div>
        <Link href="/dashboard" className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '0.82rem' }}>
          Explore Platform <ArrowRight size={14} />
        </Link>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <LandingHero3D />
        <div className="hero-content">
          <div className="hero-badge animate-fade-in">
            <Sparkles size={14} />
            <span>Introducing VaultIQ 2.0: The Digital Twin Era</span>
          </div>
          <h1 className="hero-title animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Every Enterprise Asset.<br />One Intelligent Platform.
          </h1>
          <p className="hero-subtitle animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Monitor, predict, automate, and secure your organization's assets through AI-powered insights, real-time digital twins, predictive maintenance, blockchain-backed audit trails, and enterprise-grade analytics.
          </p>
          <div className="hero-ctas animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/dashboard" className="btn btn-primary btn-premium-action glow-border">
              Explore Mission Control <ArrowRight size={16} />
            </Link>
            <button className="btn btn-premium-secondary btn-premium-action" onClick={() => {
              const el = document.getElementById('features');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Discover Platform Features
            </button>
          </div>
        </div>
      </header>

      {/* Trusted Companies Marquee */}
      <section className="trusted-marquee-section">
        <div className="marquee-title">Trusted by industry-leading operations teams</div>
        <div className="marquee-container">
          <div className="marquee-track">
            {['Stripe', 'Linear', 'Vercel', 'Apple', 'Slack', 'Figma', 'Datadog', 'Notion', 'Stripe', 'Linear', 'Vercel', 'Apple', 'Slack', 'Figma', 'Datadog', 'Notion'].map((name, i) => (
              <div key={i} className="marquee-item">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Innovations Section */}
      <section id="features" className="landing-section">
        <div className="section-header-centered">
          <span className="section-tag">Next-Gen Core</span>
          <h2 className="section-title-large">Engineered for Modern Enterprise Scale</h2>
          <p className="section-description">
            VaultIQ combines physical telemetry, AI operations, and cryptographic records into a unified digital twin workspace.
          </p>
        </div>

        <div className="feature-grid">
          {/* Card 1 */}
          <div className="feature-card-landing card-premium">
            <div className="feature-icon-wrapper">
              <Globe size={20} />
            </div>
            <h3 className="feature-card-title">Digital Twin Engine</h3>
            <p className="feature-card-desc">
              Real-time 3D synchronization for physical assets. Every server, laptop, and workstation is represented as a high-fidelity digital twin that reflects its live IoT telemetry and health status.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card-landing card-premium">
            <div className="feature-icon-wrapper">
              <Brain size={20} />
            </div>
            <h3 className="feature-card-title">AI Lifecycle Assistant</h3>
            <p className="feature-card-desc">
              Natural language insights powered by an integrated LLM. Get instant answers about budget forecasts, replacement cycles, thermal degradation, or maintenance logs.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card-landing card-premium">
            <div className="feature-icon-wrapper">
              <Shield size={20} />
            </div>
            <h3 className="feature-card-title">Blockchain Audit Trail</h3>
            <p className="feature-card-desc">
              Immutable SHA-256 hashing links every change of custody and repair report into a tamper-proof blockchain. Ensure 100% compliance and flawless audit audits.
            </p>
          </div>

          {/* Card 4 */}
          <div className="feature-card-landing card-premium">
            <div className="feature-icon-wrapper">
              <Activity size={20} />
            </div>
            <h3 className="feature-card-title">Predictive Maintenance</h3>
            <p className="feature-card-desc">
              Machine learning heuristics evaluate real-time thermal spikes, runtime metrics, and load factors to alert technicians and schedule repairs before failures occur.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive 3D Showcase */}
      <section className="landing-section" style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'rgba(13,17,23,0.2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <span className="section-tag">Digital Twin Demo</span>
            <h2 className="section-title-large" style={{ fontSize: '2.3rem' }}>Visually Inspect Hardware Remotely</h2>
            <p className="section-description" style={{ marginBottom: '24px', lineHeight: 1.7 }}>
              VaultIQ’s lightweight 3D viewer supports spatial mappings of office floorplans and detailed server room configurations. Zoom, rotate, and select assets directly from your browser to check ownership, real-time temperatures, and pending tickets.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ color: 'var(--accent-primary)', background: 'rgba(88,166,255,0.1)', padding: '6px', borderRadius: '8px' }}><Zap size={16} /></div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>98% faster incident diagnostics using 3D models</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ color: 'var(--accent-primary)', background: 'rgba(88,166,255,0.1)', padding: '6px', borderRadius: '8px' }}><History size={16} /></div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Visual timeline of historic asset checkouts</span>
              </div>
            </div>
          </div>
          <div style={{ height: '400px', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative' }} className="glow-border">
            {/* Embedded 3D rack view for the landing page */}
            <iframe src="/dashboard" style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none', opacity: 0.8 }} title="3D Preview" />
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'rgba(10,12,16,0.85)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--accent-primary)',
              fontWeight: 600
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 6px var(--accent-primary)' }} />
              Interactive Twin Live Preview
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="landing-section">
        <div className="section-header-centered">
          <span className="section-tag">Pricing Plans</span>
          <h2 className="section-title-large">Simple, Benefit-Driven Options</h2>
          <p className="section-description">Choose the right fit for your team, from scaling startups to global enterprises.</p>
        </div>

        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="price-card card-premium">
            <span className="price-tier">Starter</span>
            <div className="price-val">₹0 <span>/ mo</span></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Perfect for small startups looking to track local inventory.</p>
            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />
            <ul className="price-features">
              <li><Check size={14} /> Up to 100 assets</li>
              <li><Check size={14} /> Basic database logging</li>
              <li><Check size={14} /> Mobile QR code scanner</li>
              <li style={{ opacity: 0.4 }}><Check size={14} /> 3D Digital Twin Engine</li>
              <li style={{ opacity: 0.4 }}><Check size={14} /> AI Operations Assistant</li>
            </ul>
            <Link href="/dashboard" className="btn btn-premium-secondary" style={{ marginTop: 'auto', borderRadius: '20px' }}>Explore Starter</Link>
          </div>

          {/* Popular Tier */}
          <div className="price-card card-premium popular glow-border">
            <span className="popular-badge">Most Popular</span>
            <span className="price-tier">Professional</span>
            <div className="price-val">₹14,999 <span>/ mo</span></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>For medium teams that need 3D mapping and AI diagnostics.</p>
            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />
            <ul className="price-features">
              <li><Check size={14} /> Up to 2,500 assets</li>
              <li><Check size={14} /> Three.js 3D Digital Twin</li>
              <li><Check size={14} /> AI Assistant (500 queries/mo)</li>
              <li><Check size={14} /> Basic blockchain records</li>
              <li><Check size={14} /> Custom QR/Barcode generation</li>
            </ul>
            <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 'auto', borderRadius: '20px' }}>Start Free Trial</Link>
          </div>

          {/* Enterprise Tier */}
          <div className="price-card card-premium">
            <span className="price-tier">Enterprise</span>
            <div className="price-val">Custom <span>/ mo</span></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Custom hardware configurations, SLA, and SSO integrations.</p>
            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />
            <ul className="price-features">
              <li><Check size={14} /> Unlimited assets</li>
              <li><Check size={14} /> Azure AD/SSO Integrations</li>
              <li><Check size={14} /> Dedicated AI Operations Engine</li>
              <li><Check size={14} /> Custom cryptographic ledger</li>
              <li><Check size={14} /> 24/7 Enterprise support SLA</li>
            </ul>
            <Link href="/dashboard" className="btn btn-premium-secondary" style={{ marginTop: 'auto', borderRadius: '20px' }}>Contact Sales</Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="landing-section" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="section-header-centered">
          <span className="section-tag">FAQ</span>
          <h2 className="section-title-large">Frequently Asked Questions</h2>
        </div>

        <div className="faq-grid">
          <div className="faq-card card-premium">
            <h4 className="faq-question">What is a Digital Twin in VaultIQ?</h4>
            <p className="faq-answer">
              A digital twin is a high-fidelity 3D representation of your physical asset (e.g., a server, workstation, or router) that displays live CPU load, thermal telemetry, and status histories.
            </p>
          </div>

          <div className="faq-card card-premium">
            <h4 className="faq-question">How does the blockchain audit trail work?</h4>
            <p className="faq-answer">
              Every checkout, checkin, or maintenance action is hashed (SHA-256) and chained to the previous transaction hash. This immutable sequence ensures that custody logs are completely tamper-proof and compliance-certified.
            </p>
          </div>

          <div className="faq-card card-premium">
            <h4 className="faq-question">Can we integrate with our active directory?</h4>
            <p className="faq-answer">
              Yes. VaultIQ Enterprise supports native SSO integrations, including Azure Active Directory and Google Workspace, allowing role-based access control out of the box.
            </p>
          </div>

          <div className="faq-card card-premium">
            <h4 className="faq-question">Does it support offline barcode scanning?</h4>
            <p className="faq-answer">
              Our Quick Scan utility utilizes HTML5 QR Code decoding directly on the frontend browser, allowing staff to scan asset tags using their smartphone camera.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer style={{
        padding: '80px 24px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(10, 12, 16, 0.95)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '16px' }}>
          <Triangle size={26} fill="currentColor" />
          <span>VaultIQ</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Empowering enterprise teams to automate and monitor physical inventory.
        </p>
        <Link href="/dashboard" className="btn btn-primary" style={{ padding: '12px 30px', borderRadius: '30px' }}>
          Get Started Now <ArrowRight size={16} />
        </Link>
      </footer>
    </div>
  );
}
