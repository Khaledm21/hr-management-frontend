import { NotificationItem } from '../types';
import { mockNotifications } from '../mocks/notifications';

let notifsState = [...mockNotifications];

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    await new Promise(res => setTimeout(res, 30));
    return [...notifsState];
  },

  async markAsRead(id: string): Promise<void> {
    const n = notifsState.find(item => item.id === id);
    if (n) n.isRead = true;
  },

  async markAllAsRead(): Promise<void> {
    notifsState.forEach(n => {
      n.isRead = true;
    });
  },

  async getUnreadCount(): Promise<number> {
    return notifsState.filter(n => !n.isRead).length;
  },
};
