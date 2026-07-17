'use client';
/**
 * CommandPalette — Global Cmd+K search & quick actions.
 * Fixes Issue #23: Global Search & Command Palette.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, LayoutDashboard, Users, DollarSign, CalendarClock, BarChart3, Settings, X } from 'lucide-react';

interface PaletteItem {
  id: string;
  label: string;
  description: string;
  href?: string;
  icon: React.ReactNode;
  category: string;
}

const STATIC_ITEMS: PaletteItem[] = [
  { id: 'nav-dashboard',   label: 'Dashboard',         description: 'KPIs & analytics overview',   href: '/dashboard',   icon: <LayoutDashboard size={16} />, category: 'Navigate' },
  { id: 'nav-employees',   label: 'Employees',          description: 'Employee directory',           href: '/hr',          icon: <Users size={16} />,           category: 'Navigate' },
  { id: 'nav-payroll',     label: 'Payroll',            description: 'Salary & payslips',           href: '/payroll',     icon: <DollarSign size={16} />,      category: 'Navigate' },
  { id: 'nav-attendance',  label: 'Attendance',         description: 'Daily log & leave requests',  href: '/attendance',  icon: <CalendarClock size={16} />,   category: 'Navigate' },
  { id: 'nav-reports',     label: 'Reports',            description: 'HR analytics & exports',      href: '/reports',     icon: <BarChart3 size={16} />,       category: 'Navigate' },
  { id: 'nav-settings',    label: 'Settings',           description: 'Company & role settings',     href: '/settings',    icon: <Settings size={16} />,        category: 'Navigate' },
  { id: 'nav-recruitment', label: 'Recruitment',        description: 'Jobs & candidate pipeline',   href: '/recruitment', icon: <Users size={16} />,           category: 'Navigate' },
  { id: 'nav-analytics',   label: '3D Analytics',       description: 'Immersive HR insights',       href: '/analytics',   icon: <BarChart3 size={16} />,       category: 'Navigate' },
  { id: 'nav-orgchart',    label: 'Org Chart',          description: '3D company hierarchy',        href: '/hr/org-chart',icon: <Users size={16} />,           category: 'Navigate' },
];

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  // Simple: all words in query must appear in text
  return q.split(' ').every((word) => t.includes(word));
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = STATIC_ITEMS.filter(
    (item) => fuzzyMatch(item.label, query) || fuzzyMatch(item.description, query)
  );

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === 'Escape')    { onClose(); }
      if (e.key === 'Enter' && filtered[active]?.href) {
        window.location.href = filtered[active].href!;
        onClose();
      }
    },
    [filtered, active, onClose]
  );

  if (!open) return null;

  const grouped = filtered.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)', zIndex: 9998,
        }}
      />

      {/* Palette modal */}
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        style={{
          position: 'fixed', top: '18vh', left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 560, zIndex: 9999,
          background: 'var(--bg-secondary, #1a1a2e)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Search input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, employees, actions…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '0.95rem', color: 'var(--text-primary)', caretColor: '#818CF8',
            }}
            aria-label="Search"
            autoComplete="off"
          />
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}
            aria-label="Close palette"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <ul
          ref={listRef}
          style={{ listStyle: 'none', margin: 0, padding: '8px 0', maxHeight: 360, overflowY: 'auto' }}
          role="listbox"
        >
          {filtered.length === 0 && (
            <li style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              No results for &ldquo;{query}&rdquo;
            </li>
          )}
          {Object.entries(grouped).map(([category, items]) => (
            <React.Fragment key={category}>
              <li style={{ padding: '4px 16px 2px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                {category}
              </li>
              {items.map((item) => {
                const globalIdx = filtered.indexOf(item);
                const isActive = globalIdx === active;
                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => { if (item.href) { window.location.href = item.href; onClose(); } }}
                    onMouseEnter={() => setActive(globalIdx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '9px 16px', cursor: 'pointer',
                      background: isActive ? 'rgba(99,102,241,0.14)' : 'transparent',
                      borderLeft: isActive ? '2px solid #818CF8' : '2px solid transparent',
                    }}
                  >
                    <span style={{ color: isActive ? '#818CF8' : 'var(--text-muted)', flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.2, marginTop: 1 }}>{item.description}</div>
                    </div>
                  </li>
                );
              })}
            </React.Fragment>
          ))}
        </ul>

        {/* Footer hint */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))', display: 'flex', gap: 14, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </>
  );
}
