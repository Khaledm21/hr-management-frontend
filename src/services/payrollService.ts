import { PayrollItem, PayrollPeriodSummary, PayrollStatus } from '../types';
import { apiClient } from './apiClient';

let summariesState: PayrollPeriodSummary[] = [];
const payrollItemsCache: Record<string, PayrollItem[]> = {};

export interface PayrollFilterParams {
  period?: string;
  department?: string;
  search?: string;
  status?: PayrollStatus | 'all';
}

export const payrollService = {
  async getPayrollSummaries(): Promise<PayrollPeriodSummary[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/payroll/summaries');
        const list: PayrollPeriodSummary[] = Array.isArray(res) ? res : res?.data || [];
        if (list.length > 0) {
          summariesState = list;
          return list;
        }
      } catch (err) {
        console.warn('Backend unavailable for getPayrollSummaries:', err);
      }
    }
    await new Promise(res => setTimeout(res, 20));
    return [...summariesState];
  },

  async getPayrollSummary(period: string): Promise<PayrollPeriodSummary | null> {
    await new Promise(res => setTimeout(res, 20));
    return summariesState.find(s => s.period === period) || null;
  },

  async getPayrollItems(params: PayrollFilterParams = {}): Promise<PayrollItem[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/payroll/items', { params });
        const list: PayrollItem[] = Array.isArray(res) ? res : res?.data || [];
        if (list.length > 0) {
          return list;
        }
      } catch (err) {
        console.warn('Backend unavailable for getPayrollItems:', err);
      }
    }

    await new Promise(res => setTimeout(res, 30));
    const period = params.period || '2026-03';
    let list = [...(payrollItemsCache[period] || [])];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        i =>
          i.employeeName.toLowerCase().includes(q) ||
          i.employeeCode.toLowerCase().includes(q)
      );
    }

    if (params.department && params.department !== 'all') {
      list = list.filter(i => i.department === params.department);
    }

    if (params.status && params.status !== 'all') {
      list = list.filter(i => i.status === params.status);
    }

    return list;
  },

  async updatePeriodStatus(period: string, status: PayrollStatus, approvedBy?: string): Promise<PayrollPeriodSummary> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.put<any>(`/payroll/periods/${period}/status`, { status, approvedBy });
        const updated = res?.data || res;
        if (updated && updated.period) {
          const idx = summariesState.findIndex(s => s.period === period);
          if (idx !== -1) summariesState[idx] = updated;
          return updated;
        }
      } catch (err) {
        console.warn('Backend updatePeriodStatus failed, applying locally:', err);
      }
    }

    await new Promise(res => setTimeout(res, 30));
    const summary = summariesState.find(s => s.period === period);
    if (!summary) throw new Error('Payroll period not found');

    summary.status = status;
    if (status === 'locked') {
      summary.lockedAt = new Date().toISOString();
      summary.approvedBy = approvedBy || 'Authorized Officer';
    }

    if (payrollItemsCache[period]) {
      payrollItemsCache[period].forEach(item => {
        item.status = status;
      });
    }

    return { ...summary };
  },
};
