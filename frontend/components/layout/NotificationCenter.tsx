'use client';

/**
 * NotificationCenter — Bell icon with unread count badge and dropdown panel.
 * Resolves Issue #3 & #11: In-app notification center
 */
import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  href?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  info:    <Info size={16} className="notif-icon info" />,
  success: <CheckCircle size={16} className="notif-icon success" />,
  warning: <AlertTriangle size={16} className="notif-icon warning" />,
  error:   <XCircle size={16} className="notif-icon error" />,
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationCenter({ notifications, onMarkAllRead, onDismiss }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="notif-wrapper" ref={panelRef}>
      {/* Bell trigger */}
      <button
        className="notif-bell-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="notif-panel glass">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={onMarkAllRead}>
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={32} opacity={0.3} />
              <p>All caught up!</p>
            </div>
          ) : (
            <ul className="notif-list">
              {notifications.map((n) => (
                <li key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                  <span className="notif-type-icon">{TYPE_ICON[n.type]}</span>
                  <div className="notif-body">
                    <p className="notif-title">{n.title}</p>
                    <p className="notif-message">{n.message}</p>
                    <span className="notif-time">{timeAgo(n.timestamp)}</span>
                  </div>
                  <button
                    className="notif-dismiss"
                    onClick={() => onDismiss(n.id)}
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <style jsx>{`
        .notif-wrapper {
          position: relative;
          display: inline-block;
        }
        .notif-bell-btn {
          position: relative;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .notif-bell-btn:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }
        .notif-badge {
          position: absolute;
          top: -5px; right: -5px;
          background: var(--accent-danger, #F43F5E);
          color: #fff;
          font-size: 0.6rem;
          font-weight: 800;
          min-width: 18px; height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--bg-primary);
        }
        .notif-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 360px;
          max-height: 480px;
          border-radius: 14px;
          border: 1px solid var(--glass-border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        .notif-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px 12px;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }
        .notif-panel-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .notif-mark-all {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.75rem;
          color: var(--accent-primary);
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }
        .notif-list {
          list-style: none;
          overflow-y: auto;
          padding: 8px;
          flex: 1;
        }
        .notif-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 4px;
          transition: background 0.15s;
          cursor: pointer;
        }
        .notif-item:hover { background: rgba(255,255,255,0.04); }
        .notif-item.unread { background: rgba(99,102,241,0.07); }
        .notif-type-icon { flex-shrink: 0; margin-top: 2px; }
        :global(.notif-icon.info)    { color: #6366F1; }
        :global(.notif-icon.success) { color: #10B981; }
        :global(.notif-icon.warning) { color: #F59E0B; }
        :global(.notif-icon.error)   { color: #F43F5E; }
        .notif-body { flex: 1; min-width: 0; }
        .notif-title {
          font-size: 0.83rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 2px;
        }
        .notif-message {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .notif-time {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 4px;
          display: block;
        }
        .notif-dismiss {
          flex-shrink: 0;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition: color 0.2s;
          line-height: 1;
        }
        .notif-dismiss:hover { color: var(--text-primary); }
        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 40px 20px;
          color: var(--text-muted);
          font-size: 0.88rem;
        }
      `}</style>
    </div>
  );
}
