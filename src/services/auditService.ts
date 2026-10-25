import { AuditLogEntry } from '../types';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'new_hope_audit_logs_v1';

export const auditService = {
  async getAuditLogs(module?: string, search?: string): Promise<AuditLogEntry[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/audit-logs', {
          params: {
            module: module && module !== 'all' ? module : undefined,
            search: search && search.trim() !== '' ? search.trim() : undefined,
          },
        });
        const list = Array.isArray(res) ? res : res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('Backend /audit-logs endpoint error, falling back to local store:', err);
      }
    }

    // Local real storage fallback
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        let list: AuditLogEntry[] = JSON.parse(stored);
        if (search) {
          const q = search.toLowerCase().trim();
          list = list.filter(
            a =>
              a.userName.toLowerCase().includes(q) ||
              a.action.toLowerCase().includes(q) ||
              a.target.toLowerCase().includes(q) ||
              a.module.toLowerCase().includes(q)
          );
        }
        if (module && module !== 'all') {
          list = list.filter(a => a.module === module);
        }
        return list;
      }
    } catch {
      // ignore
    }

    return [];
  },

  async logAction(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress' | 'status'> & {
      ipAddress?: string;
      status?: 'success' | 'warning' | 'failed';
    }
  ): Promise<void> {
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}`,
      timestamp: formattedTimestamp,
      ipAddress: entry.ipAddress || '192.168.1.10',
      status: entry.status || 'success',
    };

    // Save locally
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: AuditLogEntry[] = stored ? JSON.parse(stored) : [];
      list.unshift(newLog);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 300)));
    } catch {
      // ignore
    }

    // Save to backend if available
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.post('/audit-logs', newLog);
      } catch (err) {
        console.warn('Failed to persist audit log to backend:', err);
      }
    }
  },
};
