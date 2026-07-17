'use client';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ScanQrCode,
  Wrench,
  ClipboardList,
  LogOut,
  Triangle,
  GitFork,
  Users,
  Headset,
  Building,
  ShoppingCart,
  LineChart,
  Menu,
  X,
  Shield,
  UserSquare,
  Truck
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  purpose?: string;
  icon: JSX.Element;
  roles?: string[];
};

type NavGroup = {
  label: string;
  roles?: string[];
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Cyber-Physical Hub',
    items: [
      { href: '/dashboard', label: 'Mission Control', purpose: 'Global asset health', icon: <LayoutDashboard size={18} /> },
      { href: '/inventory', label: 'Digital Twin Hub', purpose: '3D asset grid', icon: <Package size={18} /> },
      { href: '/facilities', label: 'Floor Plans', purpose: 'Spatial asset tracking', icon: <Building size={18} /> },
      { href: '/graph', label: 'Dependency Map', purpose: 'View network topology', icon: <GitFork size={18} /> },
    ]
  },
  {
    label: 'Operations & Custody',
    items: [
      { href: '/maintenance', label: 'Predictive Maintenance', purpose: 'IoT telemetry & repair', icon: <Wrench size={18} /> },
      { href: '/hr', label: 'Employee Custody', purpose: 'Onboarding & ownership', icon: <Users size={18} /> },
      { href: '/reports', label: 'Audit Ledger', purpose: 'Blockchain history', icon: <ClipboardList size={18} /> },
      { href: '/scanner', label: 'Quick Scan', purpose: 'Audit via QR', icon: <ScanQrCode size={18} /> },
      { href: '/fleet', label: 'Fleet Management', purpose: 'Company vehicles GPS', icon: <Truck size={18} /> },
    ]
  },
  {
    label: 'Access & Security',
    items: [
      { href: '/security', label: 'Security & Access', purpose: 'Digital keys & cameras', icon: <Shield size={18} />, roles: ['ADMIN'] },
      { href: '/visitor', label: 'Visitor Kiosk', purpose: 'Front desk check-in', icon: <UserSquare size={18} /> },
    ]
  },
  {
    label: 'Insights & AI',
    roles: ['ADMIN', 'MANAGER'],
    items: [
      { href: '/analytics', label: 'Deep Insights', purpose: 'Forecasts & ESG', icon: <LineChart size={18} />, roles: ['ADMIN', 'MANAGER'] },
      { href: '/procurement', label: 'Auto-Replenishment', purpose: 'Vendor management', icon: <ShoppingCart size={18} />, roles: ['ADMIN', 'MANAGER'] },
      { href: '/helpdesk', label: 'AI Assistant', purpose: 'Chat & support', icon: <Headset size={18} /> },
    ]
  }
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const normalizedPath = '/' + (pathname.replace(/^\//, '').split('/')[0] || '');

  React.useEffect(() => {
    if (!loading && !user && normalizedPath !== '/login' && normalizedPath !== '/') {
      router.replace('/login');
    }
  }, [loading, user, normalizedPath, router]);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (normalizedPath === '/login' || normalizedPath === '/') return <>{children}</>;

  if (loading || !user) {
    return (
      <div className="shell-loader">
        <div className="spinner" />
        <style>{`.shell-loader{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg-primary)}.spinner{width:40px;height:40px;border:3px solid var(--border-color);border-top-color:var(--accent-primary);border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const initials = (user.fullName || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <header className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="mobile-logo">
          <Triangle size={20} fill="currentColor" />
          <span>VaultIQ</span>
        </div>
        <div className="avatar-mobile">{initials}</div>
      </header>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <div className="layout-wrapper">
        <nav className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
          <div className="logo">
            <Triangle size={22} fill="currentColor" />
            <span>VaultIQ</span>
          </div>

          <div className="nav-menu" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {NAV_GROUPS.filter(group => !group.roles || group.roles.includes(user.role)).map((group) => (
              <div key={group.label} className="nav-group">
                <div className="nav-group-title">{group.label}</div>
                <ul>
                  {group.items.filter(item => !item.roles || item.roles.includes(user.role)).map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`nav-item ${
                          normalizedPath === item.href ? 'active' : ''
                        }`}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <div className="nav-text">
                          <span className="nav-label">{item.label}</span>
                          {item.purpose && <span className="nav-purpose">{item.purpose}</span>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="user-profile">
            <div className="user-profile-main">
              <div className="avatar">{initials}</div>
              <div>
                <div className="user-name">{user.fullName}</div>
                <div className="user-role">{user.role}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={() => logout()} aria-label="Sign out">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </nav>

        <main className="main-content">
          {children}
        </main>
      </div>

      <style>{`
        .nav-menu { padding: 0; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; overflow-x: hidden; }
        .nav-group ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
        .nav-group-title { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; padding-left: 14px; letter-spacing: 0.05em; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px; text-decoration: none; color: var(--text-secondary); font-weight: 500; font-size: 0.9rem; transition: all 0.2s ease; }
        .nav-item:hover { background: rgba(88,166,255,0.08); color: var(--text-primary); }
        .nav-item.active { background: rgba(88,166,255,0.12); color: var(--accent-primary); font-weight: 600; }
        .nav-icon { display: flex; align-items: center; flex-shrink: 0; margin-top: 2px; align-self: flex-start; }
        .nav-text { display: flex; flex-direction: column; gap: 2px; }
        .nav-label { font-size: 0.9rem; font-weight: 500; }
        .nav-purpose { font-size: 0.7rem; color: var(--text-muted); line-height: 1.1; font-weight: 400; }
        .nav-item:hover .nav-purpose { color: rgba(255,255,255,0.6); }
        .nav-item.active .nav-purpose { color: rgba(88,166,255,0.7); }
        .btn-logout { background: rgba(255,77,77,0.08); color: #ff7b78; border: 1px solid rgba(255,77,77,0.2); padding: 8px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: background 0.2s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; }
        .btn-logout:hover { background: rgba(255,77,77,0.15); }
        .user-profile-main { display: flex; align-items: center; gap: 10px; }
      `}</style>
    </>
  );
}
