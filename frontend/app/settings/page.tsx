'use client';
import React, { useState } from 'react';
import { Settings, Users, Shield, Bell, Building2, Key, Save, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type SettingsTab = 'company' | 'users' | 'roles' | 'notifications' | 'security';

const USERS_MOCK = [
  { id: '1', name: 'Kavitha R.', email: 'kavitha@hrms.com', role: 'ADMIN', status: 'active', lastLogin: '2026-07-18' },
  { id: '2', name: 'Priya Sharma', email: 'priya@hrms.com', role: 'MANAGER', status: 'active', lastLogin: '2026-07-17' },
  { id: '3', name: 'Arjun Mehta', email: 'arjun@hrms.com', role: 'USER', status: 'active', lastLogin: '2026-07-16' },
  { id: '4', name: 'Rahul Nair', email: 'rahul@hrms.com', role: 'USER', status: 'active', lastLogin: '2026-07-15' },
  { id: '5', name: 'Divya Krishnan', email: 'divya@hrms.com', role: 'MANAGER', status: 'active', lastLogin: '2026-07-14' },
];

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  ADMIN:   { color: '#F43F5E', bg: 'rgba(244,63,94,0.1)' },
  MANAGER: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  USER:    { color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
};

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'company',       label: 'Company',       icon: Building2 },
  { id: 'users',         label: 'User Management', icon: Users },
  { id: 'roles',         label: 'Roles & Permissions', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security',      label: 'Security',       icon: Key },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [saved, setSaved] = useState(false);
  const [company, setCompany] = useState({ name: 'HRMS Corp', email: 'hr@hrms.com', timezone: 'Asia/Kolkata', currency: 'INR', workingDays: '5' });
  const [userRoles, setUserRoles] = useState(USERS_MOCK);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    'Leave request approvals': true,
    'New hire onboarding': true,
    'Payroll processed': true,
    'Performance review due': false,
    'Policy acknowledgement': false,
  });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const changeRole = (id: string, role: string) => {
    setUserRoles(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200 }}>
      <div className="page-header">
        <div>
          <h1><Settings size={24} /> Settings</h1>
          <p className="page-subtitle">Manage company configuration, users, and permissions</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }} className="settings-layout">
        {/* Sidebar nav */}
        <div className="glass" style={{ padding: 8 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === t.id ? 'rgba(99,102,241,0.14)' : 'transparent',
              color: activeTab === t.id ? '#818CF8' : 'var(--text-secondary)',
              fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
              marginBottom: 2, textAlign: 'left',
            }}
              onMouseEnter={e => { if (activeTab !== t.id) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (activeTab !== t.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <t.icon size={16} />{t.label}
              {activeTab === t.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass" style={{ padding: 28 }}>
          {activeTab === 'company' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Company Information</h2>
              <div className="form-grid">
                <div className="field">
                  <label>Company Name</label>
                  <input value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>HR Email</label>
                  <input type="email" value={company.email} onChange={e => setCompany(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Timezone</label>
                  <select value={company.timezone} onChange={e => setCompany(p => ({ ...p, timezone: e.target.value }))}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Currency</label>
                  <select value={company.currency} onChange={e => setCompany(p => ({ ...p, currency: e.target.value }))}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Working Days/Week</label>
                  <select value={company.workingDays} onChange={e => setCompany(p => ({ ...p, workingDays: e.target.value }))}>
                    <option value="5">5 Days</option>
                    <option value="5.5">5.5 Days</option>
                    <option value="6">6 Days</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSave} className="btn btn-primary">
                  <Save size={14} /> {saved ? '✓ Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>User Management</h2>
                <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '7px 14px' }}>+ Invite User</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['User', 'Email', 'Role', 'Last Login', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userRoles.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>
                            {u.name.split(' ').map(n => n[0]).slice(0,2).join('')}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '11px 12px' }}>
                        {u.id === '1' ? (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, ...ROLE_COLORS[u.role] }}>{u.role}</span>
                        ) : (
                          <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-primary)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="USER">USER</option>
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-secondary)', fontSize: '0.78rem', fontFamily: 'monospace' }}>{u.lastLogin}</td>
                      <td style={{ padding: '11px 12px' }}>
                        <button style={{ background: 'none', border: 'none', color: '#F43F5E', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>Deactivate</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'roles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Roles & Permissions</h2>
              {[
                { role: 'ADMIN', color: '#F43F5E', perms: ['Full system access', 'Manage users & roles', 'View all reports', 'Manage payroll', 'Edit company settings', 'Delete records'] },
                { role: 'MANAGER', color: '#F59E0B', perms: ['View team data', 'Approve leave requests', 'Submit performance reviews', 'View payroll (own team)', 'Manage recruitment pipeline'] },
                { role: 'USER', color: '#6366F1', perms: ['View own profile', 'View own payslips', 'Request leave', 'View company directory', 'Complete training courses'] },
              ].map(r => (
                <div key={r.role} className="glass" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: '0.78rem', background: r.color + '18', color: r.color }}>{r.role}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{userRoles.filter(u => u.role === r.role).length} users assigned</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {r.perms.map(p => (
                      <span key={p} style={{ padding: '4px 12px', borderRadius: 6, fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notification Preferences</h2>
              {[
                { label: 'Leave request approvals', desc: 'Get notified when leave is approved or rejected' },
                { label: 'New hire onboarding', desc: 'Alerts when a new employee joins' },
                { label: 'Payroll processed', desc: 'Monthly payslip generation notifications' },
                { label: 'Performance review due', desc: 'Reminders for upcoming performance reviews' },
                { label: 'Policy acknowledgement', desc: 'Alerts for unacknowledged policies' },
              ].map((n, i) => (
                <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{n.desc}</div>
                  </div>
                  <label
                    onClick={() => setNotifPrefs(p => ({ ...p, [n.label]: !p[n.label] }))}
                    style={{ cursor: 'pointer', position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}
                  >
                    <span style={{
                      position: 'absolute', inset: 0,
                      background: notifPrefs[n.label] ? '#6366F1' : 'rgba(255,255,255,0.1)',
                      borderRadius: 12, transition: 'background 0.2s',
                    }} />
                    <span style={{
                      position: 'absolute',
                      left: notifPrefs[n.label] ? 22 : 2,
                      top: 2, width: 20, height: 20,
                      background: '#fff', borderRadius: '50%',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                  </label>
                </div>
              ))}
              <button onClick={handleSave} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Save size={14} /> {saved ? '\u2713 Saved!' : 'Save Preferences'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Security Settings</h2>
              <div className="glass" style={{ padding: 20 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Change Password</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380 }}>
                  <div className="field"><label>Current Password</label><input type="password" placeholder="••••••••" /></div>
                  <div className="field"><label>New Password</label><input type="password" placeholder="••••••••" /></div>
                  <div className="field"><label>Confirm New Password</label><input type="password" placeholder="••••••••" /></div>
                  <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}><Key size={14} /> Update Password</button>
                </div>
              </div>
              <div className="glass" style={{ padding: 20 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Session Management</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 12 }}>Access token expires in 15 minutes. Refresh tokens last 7 days.</div>
                <button style={{ background: 'rgba(244,63,94,0.08)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Sign Out All Sessions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
