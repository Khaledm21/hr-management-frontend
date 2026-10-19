import { PayrollItem, PayrollPeriodSummary, PayrollStatus } from '../types';
import { mockPayrollSummaries, generatePayrollItems } from '../mocks/payroll';

let summariesState = [...mockPayrollSummaries];
const payrollItemsCache: Record<string, PayrollItem[]> = {
  '2026-03': generatePayrollItems('2026-03'),
  '2026-02': generatePayrollItems('2026-02'),
  '2026-01': generatePayrollItems('2026-01'),
};

export interface PayrollFilterParams {
  period?: string;
  department?: string;
  search?: string;
  status?: PayrollStatus | 'all';
}

export const payrollService = {
  async getPayrollSummaries(): Promise<PayrollPeriodSummary[]> {
    await new Promise(res => setTimeout(res, 40));
    return [...summariesState];
  },

  async getPayrollSummary(period: string): Promise<PayrollPeriodSummary | null> {
    await new Promise(res => setTimeout(res, 40));
    return summariesState.find(s => s.period === period) || null;
  },

  async getPayrollItems(params: PayrollFilterParams = {}): Promise<PayrollItem[]> {
    await new Promise(res => setTimeout(res, 60));
    const period = params.period || '2026-03';
    if (!payrollItemsCache[period]) {
      payrollItemsCache[period] = generatePayrollItems(period);
    }

    let list = [...payrollItemsCache[period]];

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
    await new Promise(res => setTimeout(res, 70));
    const summary = summariesState.find(s => s.period === period);
    if (!summary) throw new Error('Payroll period not found');

    summary.status = status;
    if (status === 'locked') {
      summary.lockedAt = new Date().toISOString();
      summary.approvedBy = approvedBy || 'Finance Director';
    }

    if (payrollItemsCache[period]) {
      payrollItemsCache[period].forEach(item => {
        item.status = status;
      });
    }

    return { ...summary };
  },
};
