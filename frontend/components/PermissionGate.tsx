'use client';
/**
 * PermissionGate — Element-level RBAC gate component.
 * Fixes Issue #14: Permission-Aware UI Components.
 *
 * Usage:
 *   <PermissionGate module="payroll" action="process">
 *     <RunPayrollButton />
 *   </PermissionGate>
 *
 *   <PermissionGate module="settings" action="edit" fallback={<ReadOnlyBadge />}>
 *     <SettingsForm />
 *   </PermissionGate>
 *
 *   // Render nothing if no permission, no UI noise
 *   <PermissionGate module="reports" action="export" silent>
 *     <ExportBtn />
 *   </PermissionGate>
 */
import React from 'react';
import { usePermission, Module, Action } from '@/hooks/usePermission';
import { ShieldOff } from 'lucide-react';

interface PermissionGateProps {
  module: Module;
  action: Action;
  children: React.ReactNode;
  /** Rendered instead of the default denied message */
  fallback?: React.ReactNode;
  /** If true, render nothing when access denied (no denied message) */
  silent?: boolean;
  /** If true, render children but disabled/greyed out instead of hiding */
  disabled?: boolean;
}

export default function PermissionGate({
  module,
  action,
  children,
  fallback,
  silent = false,
  disabled = false,
}: PermissionGateProps) {
  const { can } = usePermission();
  const allowed = can(module, action);

  if (allowed) return <>{children}</>;

  // Greyed-out mode — render children but wrapped in a disabled overlay
  if (disabled) {
    return (
      <div
        style={{ opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}
        aria-disabled="true"
        title={`Requires ${action} permission on ${module}`}
      >
        {children}
      </div>
    );
  }

  if (silent) return null;
  if (fallback) return <>{fallback}</>;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(244,63,94,0.06)',
        border: '1px solid rgba(244,63,94,0.15)',
        color: 'var(--text-muted)',
        fontSize: '0.83rem',
      }}
      role="alert"
      aria-label="Access denied"
    >
      <ShieldOff size={16} opacity={0.5} />
      <span>You don&apos;t have permission to access this.</span>
    </div>
  );
}
