import { ApprovalItem, ApprovalCategory, ApprovalStatus } from '../types';
import { mockApprovals } from '../mocks/approvals';
import { apiClient } from './apiClient';

let approvalsState = [...mockApprovals];

export interface ApprovalFilterParams {
  category?: ApprovalCategory | 'all';
  status?: ApprovalStatus | 'all';
  search?: string;
}

export const approvalService = {
  async getApprovals(params: ApprovalFilterParams = {}): Promise<ApprovalItem[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/approvals', { params });
        const list = Array.isArray(res) ? res : res?.data;
        if (Array.isArray(list) && list.length > 0) {
          approvalsState = list;
          return list;
        }
      } catch (err) {
        console.warn('Backend /approvals endpoint unavailable, using local approvals:', err);
      }
    }

    await new Promise(res => setTimeout(res, 50));
    let list = [...approvalsState];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        a =>
          a.approvalCode.toLowerCase().includes(q) ||
          a.employeeName.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q)
      );
    }

    if (params.category && params.category !== 'all') {
      list = list.filter(a => a.category === params.category);
    }

    if (params.status && params.status !== 'all') {
      list = list.filter(a => a.status === params.status);
    }

    return list;
  },

  async approveItem(id: string, actor: string = 'Current User', comment?: string): Promise<ApprovalItem> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>(`/approvals/${id}/approve`, { actor, comment });
        const updated = res?.data || res;
        if (updated && updated.id) {
          const idx = approvalsState.findIndex(a => a.id === id);
          if (idx !== -1) approvalsState[idx] = updated;
          return updated;
        }
      } catch (err) {
        console.warn('Backend approve endpoint failed, applying locally:', err);
      }
    }

    await new Promise(res => setTimeout(res, 60));
    const item = approvalsState.find(a => a.id === id);
    if (!item) throw new Error('Approval item not found');

    item.status = 'approved';
    item.currentStep = 'Completed';
    item.history.push({
      step: 'Final Approval',
      actor,
      action: 'Approved',
      timestamp: new Date().toLocaleString(),
      comment: comment || 'Approved in full.',
    });

    return { ...item };
  },

  async rejectItem(id: string, reason: string, actor: string = 'Current User'): Promise<ApprovalItem> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>(`/approvals/${id}/reject`, { reason, actor });
        const updated = res?.data || res;
        if (updated && updated.id) {
          const idx = approvalsState.findIndex(a => a.id === id);
          if (idx !== -1) approvalsState[idx] = updated;
          return updated;
        }
      } catch (err) {
        console.warn('Backend reject endpoint failed, applying locally:', err);
      }
    }

    await new Promise(res => setTimeout(res, 60));
    const item = approvalsState.find(a => a.id === id);
    if (!item) throw new Error('Approval item not found');

    item.status = 'rejected';
    item.rejectionReason = reason;
    item.currentStep = 'Rejected';
    item.history.push({
      step: 'Review',
      actor,
      action: 'Rejected',
      timestamp: new Date().toLocaleString(),
      comment: reason,
    });

    return { ...item };
  },

  async requestChanges(id: string, notes: string, actor: string = 'Current User'): Promise<ApprovalItem> {
    await new Promise(res => setTimeout(res, 60));
    const item = approvalsState.find(a => a.id === id);
    if (!item) throw new Error('Approval item not found');

    item.status = 'changes_requested';
    item.history.push({
      step: 'Change Request',
      actor,
      action: 'Requested Changes',
      timestamp: new Date().toLocaleString(),
      comment: notes,
    });

    return { ...item };
  },
};
