import { LeaveRequest, LeaveBalance, LeaveStatus, LeaveType } from '../types';
import { apiClient } from './apiClient';

let requestsState: LeaveRequest[] = [];
let balancesState: LeaveBalance[] = [];

export interface LeaveFilterParams {
  search?: string;
  department?: string;
  leaveType?: LeaveType | 'all';
  status?: LeaveStatus | 'all';
}

export const leaveService = {
  async getLeaveRequests(params: LeaveFilterParams = {}): Promise<LeaveRequest[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/leave-requests', { params });
        const list: LeaveRequest[] = Array.isArray(res) ? res : res?.data || [];
        if (list.length > 0) {
          requestsState = list;
          return list;
        }
      } catch (err) {
        console.warn('Backend unavailable for getLeaveRequests:', err);
      }
    }
    await new Promise(res => setTimeout(res, 30));
    let filtered = [...requestsState];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        r =>
          r.employeeName.toLowerCase().includes(q) ||
          r.employeeCode.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
      );
    }

    if (params.department && params.department !== 'all') {
      filtered = filtered.filter(r => r.department === params.department);
    }

    if (params.leaveType && params.leaveType !== 'all') {
      filtered = filtered.filter(r => r.leaveType === params.leaveType);
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(r => r.status === params.status);
    }

    return filtered;
  },

  async getLeaveBalances(search?: string, department?: string): Promise<LeaveBalance[]> {
    await new Promise(res => setTimeout(res, 30));
    let filtered = [...balancesState];

    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        b =>
          b.employeeName.toLowerCase().includes(q) ||
          b.employeeCode.toLowerCase().includes(q)
      );
    }

    if (department && department !== 'all') {
      filtered = filtered.filter(b => b.department === department);
    }

    return filtered;
  },

  async approveLeave(id: string, comment?: string): Promise<LeaveRequest> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.put<any>(`/leave-requests/${id}/approve`, { comments: comment });
        const updated = res?.data || res;
        if (updated && updated.id) {
          const idx = requestsState.findIndex(r => r.id === id);
          if (idx !== -1) requestsState[idx] = updated;
          return updated;
        }
      } catch (err) {
        console.warn('Backend approveLeave failed, applying locally:', err);
      }
    }

    await new Promise(res => setTimeout(res, 30));
    const req = requestsState.find(r => r.id === id);
    if (!req) throw new Error('Leave request not found');

    req.status = 'approved';
    req.decisionAt = new Date().toISOString();
    if (comment) req.comments = comment;
    return { ...req };
  },

  async rejectLeave(id: string, reason: string): Promise<LeaveRequest> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.put<any>(`/leave-requests/${id}/reject`, { comments: reason });
        const updated = res?.data || res;
        if (updated && updated.id) {
          const idx = requestsState.findIndex(r => r.id === id);
          if (idx !== -1) requestsState[idx] = updated;
          return updated;
        }
      } catch (err) {
        console.warn('Backend rejectLeave failed, applying locally:', err);
      }
    }

    await new Promise(res => setTimeout(res, 30));
    const req = requestsState.find(r => r.id === id);
    if (!req) throw new Error('Leave request not found');

    req.status = 'rejected';
    req.decisionAt = new Date().toISOString();
    req.comments = reason;
    return { ...req };
  },

  async createLeaveRequest(data: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>): Promise<LeaveRequest> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/leave-requests', data);
        const created = res?.data || res;
        if (created && created.id) {
          requestsState.unshift(created);
          return created;
        }
      } catch (err) {
        console.warn('Backend createLeaveRequest failed, applying locally:', err);
      }
    }

    await new Promise(res => setTimeout(res, 30));
    const newReq: LeaveRequest = {
      ...data,
      id: `lr-${Date.now()}`,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
    };
    requestsState.unshift(newReq);
    return newReq;
  },
};
