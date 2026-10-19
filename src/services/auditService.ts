import { AuditLogEntry } from '../types';
import { mockAuditLogs } from '../mocks/auditLogs';

let auditState = [...mockAuditLogs];

export const auditService = {
  async getAuditLogs(module?: string, search?: string): Promise<AuditLogEntry[]> {
    await new Promise(res => setTimeout(res, 40));
    let list = [...auditState];

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
  },

  async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    auditState.unshift({
      ...entry,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
  },
};
