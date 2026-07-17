/**
 * usePermission — Centralized RBAC hook.
 * Replaces scattered role checks in individual components.
 * Resolves Issue #2: RBAC Middleware
 *
 * Role hierarchy: superAdmin > hrManager > teamLead > employee
 *
 * Usage:
 *   const { can, role } = usePermission();
 *   if (can('payroll', 'process')) { ... }
 */

import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export type Role = 'superAdmin' | 'hrManager' | 'teamLead' | 'employee' | 'guest';
export type Module = 'employees' | 'payroll' | 'attendance' | 'performance' | 'recruitment' | 'compliance' | 'reports' | 'settings';
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
  },
  guest: {},
};

export function usePermission() {
  const auth = useContext(AuthContext);
  const role: Role = (auth?.user?.role as Role) || 'guest';

  const can = (module: Module, action: Action): boolean => {
    const allowed = PERMISSIONS[role]?.[module] || [];
    return allowed.includes(action);
  };

  const canAny = (module: Module, actions: Action[]): boolean => {
    return actions.some((action) => can(module, action));
  };

  const canAll = (module: Module, actions: Action[]): boolean => {
    return actions.every((action) => can(module, action));
  };

  return { can, canAny, canAll, role };
}
