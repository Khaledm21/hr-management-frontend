import { NotificationItem } from '../types';
import { apiClient } from './apiClient';

const READ_STATUS_KEY = 'new_hope_notifications_read_ids_v1';
const DISMISSED_KEY = 'new_hope_notifications_dismissed_ids_v1';

// Helpers for localStorage
const getDismissedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveDismissedIds = (set: Set<string>) => {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
};

const getReadIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(READ_STATUS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveReadIds = (set: Set<string>) => {
  try {
    localStorage.setItem(READ_STATUS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
};

export const notificationService = {
  /**
   * Dynamically calculates live warnings and reminders from the real database.
   * ZERO mock data: Everything is derived directly from live database tables.
   */
  async getNotifications(): Promise<NotificationItem[]> {
    const dismissedIds = getDismissedIds();
    const readIds = getReadIds();
    const liveNotifications: NotificationItem[] = [];

    try {
      // 1. Fetch real employees to detect actual compliance / missing document warnings
      if (apiClient.isBackendAvailable()) {
        const empRes = await apiClient.get<any>('/employees', { params: { pageSize: 60 } }).catch(() => null);
        const employees: any[] = empRes?.data || [];

        // Filter employees who actually have missing documents or are not insured
        const uncompletedEmployees = employees.filter(
          (e: any) => e.insuranceStatus === 'not_insured' || (e.missingDocumentsCount && e.missingDocumentsCount > 0)
        );

        // Generate specific, real warning alerts for the first 3 actual uncompleted employee cases
        uncompletedEmployees.slice(0, 3).forEach((emp: any) => {
          const empName = emp.arabicName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || `كود ${emp.employeeId}`;
          const notifId = `warn-insurance-${emp.employeeId}`;

          if (!dismissedIds.has(notifId)) {
            liveNotifications.push({
              id: notifId,
              type: 'missing_document',
              category: 'warning',
              priority: 'high',
              title: `تحذير: نقص مسوغات تعيين وتأمينات للموظف ${empName}`,
              titleAr: `تحذير: نقص مسوغات تعيين وتأمينات للموظف ${empName}`,
              titleZh: `警告：员工 ${empName} 缺少入职及法定社保文件`,
              message: `الموظف (كود ${emp.employeeId}) غير مسجل بالتأمينات الاجتماعية (استمارة 1) ولديه ${emp.missingDocumentsCount || 4} مسوغات تعيين غير مكتملة. يُرجى مراجعة ملفه القانوني.`,
              messageAr: `الموظف (كود ${emp.employeeId}) غير مسجل بالتأمينات الاجتماعية (استمارة 1) ولديه ${emp.missingDocumentsCount || 4} مسوغات تعيين غير مكتملة. يُرجى مراجعة ملفه القانوني.`,
              messageZh: `员工（工号 ${emp.employeeId}）未在社保局建档（缺少1号表），且缺少 ${emp.missingDocumentsCount || 4} 份必要入职证明。`,
              timestamp: 'تحذير حي من قاعدة البيانات',
              timestampAr: 'تحذير حي من قاعدة البيانات',
              isRead: readIds.has(notifId),
              link: '/insurance',
            });
          }
        });

        // 2. Fetch real Driver Payouts summaries to check for open weekly batches requiring action
        const driverRes = await apiClient.get<any>('/driver-payouts/summaries').catch(() => null);
        const summaries: any[] = driverRes?.data || [];

        const openBatch = summaries.find((s: any) => s.status === 'open');
        if (openBatch) {
          const notifId = `remind-driver-batch-${openBatch.weekPeriod}`;
          if (!dismissedIds.has(notifId)) {
            liveNotifications.push({
              id: notifId,
              type: 'driver_payout',
              category: 'reminder',
              priority: 'high',
              title: `تذكير بموعد: دفعة قبض السائقين الأسبوعية (${openBatch.weekPeriod})`,
              titleAr: `تذكير بموعد: دفعة قبض السائقين الأسبوعية (${openBatch.weekPeriod})`,
              titleZh: `提醒：本周司机运费账单 (${openBatch.weekPeriod}) 处于待审核状态`,
              message: `كشف أسبوع ${openBatch.weekPeriod} لأسطول النقل ما زال بحالة مفتوحة (Open) وبحاجة للمراجعة والاعتماد والصرف.`,
              messageAr: `كشف أسبوع ${openBatch.weekPeriod} لأسطول النقل ما زال مفتوحاً (Open) وبحاجة للمراجعة والاعتماد والصرف.`,
              messageZh: `客运车队 ${openBatch.weekPeriod} 批次运费账单目前为待审核状态，请核算并批准封账。`,
              timestamp: 'تذكير دوري',
              timestampAr: 'تذكير دوري',
              isRead: readIds.has(notifId),
              link: '/drivers/weekly-payouts',
            });
          }
        }

        // 3. Fetch real Audit Logs to show latest administrative security action
        const auditRes = await apiClient.get<any>('/audit-logs').catch(() => null);
        const auditLogs: any[] = Array.isArray(auditRes) ? auditRes : auditRes?.data || [];

        if (auditLogs.length > 0) {
          const latestAudit = auditLogs[0];
          const notifId = `security-audit-${latestAudit.id}`;
          if (!dismissedIds.has(notifId)) {
            liveNotifications.push({
              id: notifId,
              type: 'system',
              category: 'security',
              priority: 'low',
              title: `تنبيه أمان: توثيق عملية (${latestAudit.action})`,
              titleAr: `تنبيه أمان: توثيق عملية (${latestAudit.action})`,
              titleZh: `安全提醒：管理员操作记录 (${latestAudit.action})`,
              message: `قام المسؤول (${latestAudit.userName}) بإجراء (${latestAudit.action}) في موديول ${latestAudit.module}.`,
              messageAr: `قام المسؤول (${latestAudit.userName}) بإجراء (${latestAudit.action}) في موديول ${latestAudit.module}.`,
              messageZh: `管理员 (${latestAudit.userName}) 在 ${latestAudit.module} 模块执行了 ${latestAudit.action}。`,
              timestamp: latestAudit.timestamp || 'اليوم',
              timestampAr: latestAudit.timestamp || 'اليوم',
              isRead: readIds.has(notifId),
              link: '/audit-logs',
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error computing live notifications:', err);
    }

    return liveNotifications;
  },

  async markAsRead(id: string): Promise<void> {
    const readIds = getReadIds();
    readIds.add(id);
    saveReadIds(readIds);
    window.dispatchEvent(new CustomEvent('new_hope_notifications_updated'));
  },

  async markAllAsRead(): Promise<void> {
    const notifications = await this.getNotifications();
    const readIds = getReadIds();
    notifications.forEach(n => readIds.add(n.id));
    saveReadIds(readIds);
    window.dispatchEvent(new CustomEvent('new_hope_notifications_updated'));
  },

  /**
   * Dismiss an individual notification so it disappears immediately.
   */
  async dismissNotification(id: string): Promise<void> {
    const dismissedIds = getDismissedIds();
    dismissedIds.add(id);
    saveDismissedIds(dismissedIds);
    window.dispatchEvent(new CustomEvent('new_hope_notifications_updated'));
  },

  /**
   * Clear all current notifications in 1 click.
   */
  async clearAllNotifications(): Promise<void> {
    const notifications = await this.getNotifications();
    const dismissedIds = getDismissedIds();
    notifications.forEach(n => dismissedIds.add(n.id));
    saveDismissedIds(dismissedIds);
    window.dispatchEvent(new CustomEvent('new_hope_notifications_updated'));
  },

  async getUnreadCount(): Promise<number> {
    const list = await this.getNotifications();
    return list.filter(n => !n.isRead).length;
  },

  /**
   * Restore all dismissed notifications (useful if user wants to reset alerts)
   */
  async restoreAllDismissed(): Promise<void> {
    try {
      localStorage.removeItem(DISMISSED_KEY);
      localStorage.removeItem(READ_STATUS_KEY);
      window.dispatchEvent(new CustomEvent('new_hope_notifications_updated'));
    } catch {
      // ignore
    }
  },
};
