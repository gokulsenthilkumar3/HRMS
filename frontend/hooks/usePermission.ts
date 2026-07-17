/**
 * usePermission — Centralized RBAC hook.
 * Bridges AuthContext roles (ADMIN/MANAGER/USER) with granular module/action permissions.
 * Fixes Issue #12 & #14.
 *
 * Usage:
 *   const { can, role } = usePermission();
 *   if (can('payroll', 'process')) { ... }
 */

import { useContext } from 'react';
import { AuthContext, mapRoleToPermissionRole } from '@/context/AuthContext';

export type Role = 'superAdmin' | 'hrManager' | 'teamLead' | 'employee' | 'guest';
export type Module =
  | 'employees' | 'payroll' | 'attendance' | 'performance'
  | 'recruitment' | 'compliance' | 'reports' | 'settings'
  | 'training' | 'helpdesk' | 'analytics' | 'orgchart';
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'process' | 'approve' | 'export';

type PermissionMatrix = {
  [role in Role]: {
    [module in Module]?: Action[];
  };
};

const PERMISSIONS: PermissionMatrix = {
  superAdmin: {
    employees:   ['view', 'create', 'edit', 'delete', 'export'],
    payroll:     ['view', 'create', 'edit', 'delete', 'process', 'approve', 'export'],
    attendance:  ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    performance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    recruitment: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    compliance:  ['view', 'create', 'edit', 'delete', 'export'],
    reports:     ['view', 'export'],
    settings:    ['view', 'create', 'edit', 'delete'],
    training:    ['view', 'create', 'edit', 'delete', 'export'],
    helpdesk:    ['view', 'create', 'edit', 'delete'],
    analytics:   ['view', 'export'],
    orgchart:    ['view', 'edit'],
  },
  hrManager: {
    employees:   ['view', 'create', 'edit', 'export'],
    payroll:     ['view', 'create', 'edit', 'process', 'export'],
    attendance:  ['view', 'create', 'edit', 'approve', 'export'],
    performance: ['view', 'create', 'edit', 'approve', 'export'],
    recruitment: ['view', 'create', 'edit', 'approve', 'export'],
    compliance:  ['view', 'export'],
    reports:     ['view', 'export'],
    settings:    ['view', 'edit'],
    training:    ['view', 'create', 'edit', 'export'],
    helpdesk:    ['view', 'create', 'edit'],
    analytics:   ['view', 'export'],
    orgchart:    ['view'],
  },
  teamLead: {
    employees:   ['view', 'export'],
    payroll:     ['view'],
    attendance:  ['view', 'approve'],
    performance: ['view', 'create', 'edit'],
    recruitment: ['view'],
    compliance:  ['view'],
    reports:     ['view'],
    settings:    [],
    training:    ['view'],
    helpdesk:    ['view', 'create'],
    analytics:   ['view'],
    orgchart:    ['view'],
  },
  employee: {
    employees:   ['view'],
    payroll:     ['view'],
    attendance:  ['view', 'create'],
    performance: ['view'],
    recruitment: [],
    compliance:  ['view'],
    reports:     [],
    settings:    [],
    training:    ['view'],
    helpdesk:    ['view', 'create'],
    analytics:   [],
    orgchart:    ['view'],
  },
  guest: {},
};

export function usePermission() {
  const auth = useContext(AuthContext);
  // Bridge: map ADMIN/MANAGER/USER -> superAdmin/hrManager/employee
  const rawRole = auth?.user?.role;
  const role: Role = rawRole
    ? (mapRoleToPermissionRole(rawRole) as Role)
    : 'guest';

  const can = (module: Module, action: Action): boolean => {
    const allowed = PERMISSIONS[role]?.[module] ?? [];
    return allowed.includes(action);
  };

  const canAny = (module: Module, actions: Action[]): boolean =>
    actions.some((action) => can(module, action));

  const canAll = (module: Module, actions: Action[]): boolean =>
    actions.every((action) => can(module, action));

  return { can, canAny, canAll, role };
}
