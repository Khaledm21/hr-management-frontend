import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  restoreAllDismissed: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    const list = await notificationService.getNotifications();
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.isRead).length);
  }, []);

  useEffect(() => {
    refreshNotifications();

    const handleUpdate = () => {
      refreshNotifications();
    };

    window.addEventListener('new_hope_notifications_updated', handleUpdate);
    return () => window.removeEventListener('new_hope_notifications_updated', handleUpdate);
  }, [refreshNotifications]);

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    await refreshNotifications();
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    await refreshNotifications();
  };

  const dismissNotification = async (id: string) => {
    await notificationService.dismissNotification(id);
    await refreshNotifications();
  };

  const clearAllNotifications = async () => {
    await notificationService.clearAllNotifications();
    await refreshNotifications();
  };

  const restoreAllDismissed = async () => {
    await notificationService.restoreAllDismissed();
    await refreshNotifications();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearAllNotifications,
        restoreAllDismissed,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
