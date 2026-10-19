import { AdvanceItem, AdvanceStatus } from '../types';
import { mockAdvances } from '../mocks/advances';

let advancesState = [...mockAdvances];

export const advanceService = {
  async getAdvances(status?: AdvanceStatus | 'all', search?: string): Promise<AdvanceItem[]> {
    await new Promise(res => setTimeout(res, 50));
    let list = [...advancesState];

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        a =>
          a.employeeName.toLowerCase().includes(q) ||
          a.employeeCode.toLowerCase().includes(q) ||
          a.advanceNumber.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      list = list.filter(a => a.status === status);
    }

    return list;
  },

  async approveAdvance(id: string): Promise<AdvanceItem> {
    await new Promise(res => setTimeout(res, 60));
    const adv = advancesState.find(a => a.id === id);
    if (!adv) throw new Error('Advance not found');
    adv.status = 'approved';
    adv.approvedAt = new Date().toISOString().split('T')[0];
    return { ...adv };
  },

  async rejectAdvance(id: string): Promise<AdvanceItem> {
    await new Promise(res => setTimeout(res, 60));
    const adv = advancesState.find(a => a.id === id);
    if (!adv) throw new Error('Advance not found');
    adv.status = 'rejected';
    return { ...adv };
  },

  async createAdvance(data: {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    department: string;
    amount: number;
    installmentsCount: number;
    purpose: string;
  }): Promise<AdvanceItem> {
    await new Promise(res => setTimeout(res, 80));
    const newAdv: AdvanceItem = {
      id: `adv-${Date.now()}`,
      advanceNumber: `ADV-2026-${String(advancesState.length + 101).padStart(4, '0')}`,
      employeeId: data.employeeId,
      employeeCode: data.employeeCode,
      employeeName: data.employeeName,
      department: data.department,
      amount: data.amount,
      installmentsCount: data.installmentsCount,
      installmentAmount: Math.round(data.amount / data.installmentsCount),
      remainingBalance: data.amount,
      purpose: data.purpose,
      status: 'pending',
      requestedAt: new Date().toISOString().split('T')[0],
    };
    advancesState.unshift(newAdv);
    return newAdv;
  },
};
