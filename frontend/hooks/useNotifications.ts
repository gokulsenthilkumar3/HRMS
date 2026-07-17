'use client';

/**
 * useNotifications — manages in-app notification state.
 * Resolves Issue #3: In-app notification system
 */
import { useState, useCallback } from 'react';
import type { Notification, NotificationType } from '@/components/layout/NotificationCenter';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (type: NotificationType, title: string, message: string, href?: string) => {
      const newNotif: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        title,
        message,
        timestamp: new Date(),
        read: false,
        href,
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 50)); // keep latest 50
    },
    []
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, addNotification, markAllRead, dismiss, unreadCount };
}
