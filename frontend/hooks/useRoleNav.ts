/**
 * useRoleNav — Returns sidebar nav groups filtered by the current user's RBAC permissions.
 * Fixes Issue #19: Role-aware sidebar navigation.
 *
 * Each nav item declares a required { module, action } — items the user can't access are hidden.
 */
import { usePermission, Module, Action } from './usePermission';

export interface NavItem {
  href: string;
  label: string;
  purpose: string;
  iconName: string;
  module?: Module;
  action?: Action;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ALL_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', purpose: 'KPIs & analytics', iconName: 'LayoutDashboard' },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/hr',             label: 'Employees',   purpose: 'Directory & profiles',  iconName: 'Users',      module: 'employees',  action: 'view' },
      { href: '/hr/onboarding',  label: 'Onboarding',  purpose: 'New hire checklist',    iconName: 'UserPlus',   module: 'employees',  action: 'create' },
      { href: '/hr/org-chart',   label: 'Org Chart',   purpose: 'Company hierarchy',     iconName: 'Building2',  module: 'orgchart',   action: 'view' },
    ],
  },
  {
    label: 'Time & Pay',
    items: [
      { href: '/attendance', label: 'Attendance', purpose: 'Daily log & leave',   iconName: 'CalendarClock', module: 'attendance', action: 'view' },
      { href: '/payroll',    label: 'Payroll',    purpose: 'Salary & payslips',   iconName: 'DollarSign',    module: 'payroll',    action: 'view' },
    ],
  },
  {
    label: 'Talent',
    items: [
      { href: '/performance',  label: 'Performance',   purpose: 'Goals & reviews',   iconName: 'TrendingUp',    module: 'performance',  action: 'view' },
      { href: '/training',     label: 'Training & L&D',purpose: 'Courses & skills',  iconName: 'GraduationCap', module: 'training',     action: 'view' },
      { href: '/recruitment',  label: 'Recruitment',   purpose: 'Jobs & pipeline',   iconName: 'Briefcase',     module: 'recruitment',  action: 'view' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { href: '/compliance', label: 'Compliance', purpose: 'Policies & audits',      iconName: 'ShieldCheck', module: 'compliance', action: 'view' },
      { href: '/reports',    label: 'Reports',    purpose: 'HR analytics exports',   iconName: 'BarChart3',   module: 'reports',    action: 'view' },
      { href: '/analytics',  label: 'Analytics',  purpose: '3D HR insights',         iconName: 'Activity',    module: 'analytics',  action: 'view' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { href: '/helpdesk', label: 'Helpdesk', purpose: 'Tickets & support', iconName: 'MessageSquare', module: 'helpdesk', action: 'view' },
      { href: '/settings', label: 'Settings', purpose: 'Company & roles',   iconName: 'Settings',      module: 'settings', action: 'view' },
    ],
  },
];

export function useRoleNav(): NavGroup[] {
  const { can } = usePermission();

  return ALL_NAV
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.module || !item.action) return true; // always-visible items
        return can(item.module, item.action);
      }),
    }))
    .filter((group) => group.items.length > 0);
}
