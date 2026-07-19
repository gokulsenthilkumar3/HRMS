'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarClock,
  DollarSign,
  TrendingUp,
  GraduationCap,
  Briefcase,
  ClipboardList,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Building2,
  UserPlus,
  BarChart3,
  ShieldCheck,
  Package,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  purpose: string;
  icon: React.ReactNode;
  roles?: string[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        purpose: 'KPIs & analytics',
        icon: <LayoutDashboard size={17} />,
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        href: '/hr',
        label: 'Employees',
        purpose: 'Directory & profiles',
        icon: <Users size={17} />,
      },
      {
        href: '/hr/onboarding',
        label: 'Onboarding',
        purpose: 'New hire checklist',
        icon: <UserPlus size={17} />,
      },
      {
        href: '/hr/org-chart',
        label: 'Org Chart',
        purpose: 'Company hierarchy',
        icon: <Building2 size={17} />,
      },
    ],
  },
  {
    label: 'Time & Pay',
    items: [
      {
        href: '/attendance',
        label: 'Attendance',
        purpose: 'Daily log & leave',
        icon: <CalendarClock size={17} />,
      },
      {
        href: '/payroll',
        label: 'Payroll',
        purpose: 'Salary & payslips',
        icon: <DollarSign size={17} />,
      },
    ],
  },
  {
    label: 'Talent',
    items: [
      {
        href: '/performance',
        label: 'Performance',
        purpose: 'Goals & reviews',
        icon: <TrendingUp size={17} />,
      },
      {
        href: '/training',
        label: 'Training & L&D',
        purpose: 'Courses & skills',
        icon: <GraduationCap size={17} />,
      },
      {
        href: '/recruitment',
        label: 'Recruitment',
        purpose: 'Jobs & pipeline',
        icon: <Briefcase size={17} />,
      },
    ],
  },
  {
    label: 'Compliance',
    items: [
      {
        href: '/compliance',
        label: 'Compliance',
        purpose: 'Policies & audits',
        icon: <ShieldCheck size={17} />,
      },
      {
        href: '/reports',
        label: 'Reports',
        purpose: 'HR analytics exports',
        icon: <BarChart3 size={17} />,
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      {
        href: '/assets',
        label: 'Asset Management',
        purpose: 'Inventory & assignments',
        icon: <Package size={17} />,
      },
      {
        href: '/helpdesk',
        label: 'Helpdesk',
        purpose: 'Tickets & support',
        icon: <MessageSquare size={17} />,
      },
      {
        href: '/settings',
        label: 'Settings',
        purpose: 'Company & roles',
        icon: <Settings size={17} />,
        roles: ['superAdmin', 'hrManager'],
      },
    ],
  },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hrms-theme');
      return saved ? saved === 'dark' : true;
    }
    return true;
  });
  const { notifications, markAllRead, dismiss } = useNotifications();

  const normalizedPath = '/' + (pathname.replace(/^\//, '').split('/')[0] || '');

  useEffect(() => {
    if (!loading && !user && normalizedPath !== '/login' && normalizedPath !== '/') {
      router.replace('/login');
    }
  }, [loading, user, normalizedPath, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('hrms-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (normalizedPath === '/login' || normalizedPath === '/') return <>{children}</>;

  if (loading || !user) {
    return (
      <div className="shell-loader">
        <div className="shell-spinner" />
      </div>
    );
  }

  const initials = (user.fullName || 'HR')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel: Record<string, string> = {
    superAdmin: 'Super Admin',
    hrManager: 'HR Manager',
    teamLead: 'Team Lead',
    employee: 'Employee',
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="mobile-logo">
          <span className="logo-icon">HR</span>
          <span>HRMS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NotificationCenter
            notifications={notifications}
            onMarkAllRead={markAllRead}
            onDismiss={dismiss}
          />
          <div className="avatar-mobile">{initials}</div>
        </div>
      </header>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <div className="layout-wrapper">
        {/* Sidebar */}
        <nav className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
          {/* Logo */}
          <div className="logo">
            <span className="logo-icon-lg">HR</span>
            <div>
              <div className="logo-name">HRMS</div>
              <div className="logo-tagline">People Operations</div>
            </div>
          </div>

          {/* Nav groups */}
          <div className="nav-scroll">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="nav-group">
                <div className="nav-group-title">{group.label}</div>
                <ul>
                  {group.items
                    .filter(
                      (item) =>
                        !item.roles || item.roles.includes(user.role)
                    )
                    .map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                          >
                            <span className="nav-icon">{item.icon}</span>
                            <div className="nav-text">
                              <span className="nav-label">{item.label}</span>
                              <span className="nav-purpose">{item.purpose}</span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom: theme toggle + user */}
          <div className="sidebar-footer">
            <button
              className="theme-toggle"
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              {darkMode ? 'Light mode' : 'Dark mode'}
            </button>

            <div className="user-card">
              <div className="avatar">{initials}</div>
              <div className="user-info">
                <div className="user-name">{user.fullName}</div>
                <div className="user-role">{roleLabel[user.role] ?? user.role}</div>
              </div>
              <NotificationCenter
                notifications={notifications}
                onMarkAllRead={markAllRead}
                onDismiss={dismiss}
              />
            </div>

            <button className="btn-logout" onClick={() => logout()}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </nav>

        {/* Main */}
        <main className="main-content">{children}</main>
      </div>

      <style>{`
        .shell-loader {
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; background: var(--bg-primary);
        }
        .shell-spinner {
          width: 38px; height: 38px;
          border: 3px solid var(--border-color);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Logo */
        .logo-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .logo-icon-lg {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 800; color: #fff; flex-shrink: 0;
          font-family: var(--font-sora, sans-serif);
        }
        .logo-name {
          font-family: var(--font-sora, sans-serif);
          font-size: 1rem; font-weight: 800;
          color: var(--text-primary); line-height: 1.2;
        }
        .logo-tagline {
          font-size: 0.65rem; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        /* Nav scroll */
        .nav-scroll {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          display: flex; flex-direction: column; gap: 18px;
          padding: 4px 0;
        }
        .nav-scroll::-webkit-scrollbar { width: 4px; }
        .nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }

        .nav-group ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1px; }
        .nav-group-title {
          font-size: 0.68rem; text-transform: uppercase; font-weight: 700;
          color: var(--text-muted); margin-bottom: 6px; padding-left: 12px; letter-spacing: 0.08em;
        }
        .nav-item {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 12px; border-radius: 8px;
          text-decoration: none; color: var(--text-secondary);
          font-size: 0.875rem; transition: all 0.15s ease;
        }
        .nav-item:hover { background: rgba(99,102,241,0.08); color: var(--text-primary); }
        .nav-item.active {
          background: rgba(99,102,241,0.14);
          color: #818CF8;
          font-weight: 600;
        }
        .nav-icon { display: flex; align-items: center; flex-shrink: 0; }
        .nav-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .nav-label { font-size: 0.875rem; font-weight: 500; line-height: 1.2; }
        .nav-purpose { font-size: 0.68rem; color: var(--text-muted); line-height: 1; }
        .nav-item:hover .nav-purpose { color: rgba(255,255,255,0.45); }
        .nav-item.active .nav-purpose { color: rgba(129,140,248,0.65); }

        /* Sidebar footer */
        .sidebar-footer {
          margin-top: auto; padding-top: 14px;
          border-top: 1px solid var(--border-color);
          display: flex; flex-direction: column; gap: 8px;
        }
        .theme-toggle {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.04); border: 1px solid var(--border-color);
          color: var(--text-secondary); border-radius: 7px;
          padding: 7px 10px; font-size: 0.78rem; cursor: pointer;
          transition: all 0.2s; width: 100%;
        }
        .theme-toggle:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
        .user-card {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 0;
        }
        .user-info { flex: 1; min-width: 0; }
        .user-name { font-size: 0.83rem; font-weight: 600; color: var(--text-primary); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-role { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .btn-logout {
          background: rgba(244,63,94,0.07); color: #FDA4AF;
          border: 1px solid rgba(244,63,94,0.18);
          padding: 8px 12px; border-radius: 7px; font-size: 0.8rem;
          font-weight: 600; cursor: pointer; transition: background 0.2s;
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-logout:hover { background: rgba(244,63,94,0.14); }
      `}</style>
    </>
  );
}
