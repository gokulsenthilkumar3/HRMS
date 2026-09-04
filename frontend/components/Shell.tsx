'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import CommandPalette from '@/components/CommandPalette';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  DollarSign,
  TrendingUp,
  GraduationCap,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  UserPlus,
  BarChart3,
  ShieldCheck,
  Package,
  Search,
  ChevronRight,
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
        href: '/hr/add',
        label: 'Add Employee',
        purpose: 'Create employee record',
        icon: <UserPlus size={17} />,
        roles: ['ADMIN', 'MANAGER'],
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
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        href: '/reports',
        label: 'Reports',
        purpose: 'HR analytics exports',
        icon: <BarChart3 size={17} />,
        roles: ['ADMIN', 'MANAGER'],
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
        roles: ['ADMIN'],
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
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();

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

  if (normalizedPath === '/login' || normalizedPath === '/signup' || normalizedPath === '/') return <>{children}</>;

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
    ADMIN: 'Administrator',
    MANAGER: 'Manager',
    USER: 'Employee',
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
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => !item.roles || item.roles.includes(user.role));
              if (!visibleItems.length) return null;
              return (
                <div key={group.label} className="nav-group">
                  <div className="nav-group-title">{group.label}</div>
                  <ul>
                    {visibleItems.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/dashboard' && item.href !== '/hr' && pathname.startsWith(`${item.href}/`));
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
              );
            })}
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
        <main className="main-content">
          <header className="app-topbar">
            <div className="breadcrumb" aria-label="Current location">
              <span className="breadcrumb-muted">Workspace</span>
              <ChevronRight size={14} />
              <span className="breadcrumb-current">{pathname === '/dashboard' ? 'Dashboard' : pathname.split('/')[1]?.replace('-', ' ') || 'Workspace'}</span>
            </div>
            <div className="topbar-actions">
              <button className="global-search" type="button" onClick={() => setCommandOpen(true)} aria-label="Search pages and actions">
                <Search size={16} aria-hidden="true" />
                <span>Search pages and actions</span>
                <kbd>Ctrl K</kbd>
              </button>
              <NotificationCenter
                notifications={notifications}
                onMarkAllRead={markAllRead}
                onDismiss={dismiss}
              />
              <div className="topbar-user" title={user.fullName}>
                <div className="avatar avatar-sm">{initials}</div>
                <div className="topbar-user-copy">
                  <strong>{user.fullName}</strong>
                  <span>{roleLabel[user.role] ?? user.role}</span>
                </div>
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />

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

        .app-topbar {
          min-height: 68px; padding: 0 32px; display: flex; align-items: center;
          justify-content: space-between; gap: 20px; position: sticky; top: 0; z-index: 40;
          background: color-mix(in srgb, var(--bg-primary) 90%, transparent);
          border-bottom: 1px solid var(--border-color); backdrop-filter: blur(16px);
        }
        .breadcrumb { display: flex; align-items: center; gap: 7px; color: var(--text-secondary); font-size: .78rem; text-transform: capitalize; }
        .breadcrumb-muted { color: var(--text-muted); }
        .breadcrumb-current { color: var(--text-primary); font-weight: 700; }
        .topbar-actions { display: flex; align-items: center; gap: 12px; }
        .global-search { width: min(310px, 28vw); min-width: 190px; display: flex; align-items: center; gap: 9px; padding: 9px 11px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--card-bg); color: var(--text-muted); cursor:pointer; font-family:inherit; }
        .global-search:focus-visible { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-glow); outline:0; }
        .global-search span { min-width: 0; flex: 1; overflow:hidden; text-align:left; text-overflow:ellipsis; white-space:nowrap; color:var(--text-muted); font-size: .78rem; }
        .global-search kbd { padding: 2px 5px; border: 1px solid var(--border-color); border-radius: 5px; color: var(--text-muted); font: 600 .65rem var(--font-sans); }
        .topbar-user { display: flex; align-items: center; gap: 9px; padding-left: 4px; }
        .avatar-sm { width: 32px; height: 32px; font-size: .65rem; }
        .topbar-user-copy { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .topbar-user-copy strong { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .76rem; }
        .topbar-user-copy span { color: var(--text-muted); font-size: .64rem; text-transform: uppercase; letter-spacing: .04em; }

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
