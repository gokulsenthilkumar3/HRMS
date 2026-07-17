'use client';
/**
 * RoleGuard — declarative permission gate component.
 * Upgraded to use usePermission() hook (fixes Issue #2).
 *
 * Usage:
 *   <RoleGuard module="payroll" action="process">
 *     <PayrunButton />
 *   </RoleGuard>
 *
 *   <RoleGuard module="settings" action="edit" fallback={<ReadOnlySettings />}>
 *     <SettingsForm />
 *   </RoleGuard>
 */
import React from 'react';
import { usePermission, Module, Action } from '@/hooks/usePermission';
import { ShieldOff } from 'lucide-react';

interface RoleGuardProps {
  module: Module;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  silent?: boolean; // if true, render nothing instead of the default denied UI
}

export default function RoleGuard({
  module,
  action,
  children,
  fallback,
  silent = false,
}: RoleGuardProps) {
  const { can } = usePermission();

  if (can(module, action)) return <>{children}</>;

  if (silent) return null;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="role-guard-denied">
      <ShieldOff size={20} opacity={0.4} />
      <span>You don&apos;t have permission to access this.</span>
      <style jsx>{`
        .role-guard-denied {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 8px;
          background: rgba(244, 63, 94, 0.06);
          border: 1px solid rgba(244, 63, 94, 0.15);
          color: var(--text-muted);
          font-size: 0.83rem;
        }
      `}</style>
    </div>
  );
}
