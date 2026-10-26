import { AttendanceRecord, AttendanceStatus } from '../types';
import { apiClient } from './apiClient';

let attendanceState: AttendanceRecord[] = [];

export interface AttendanceFilterParams {
  search?: string;
  department?: string;
  status?: AttendanceStatus | 'all';
  date?: string;
}

export const attendanceService = {
  async getAttendance(params: AttendanceFilterParams = {}): Promise<AttendanceRecord[]> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/attendance', { params });
        const list: AttendanceRecord[] = Array.isArray(res) ? res : res?.data || [];
        if (list.length > 0) {
          attendanceState = list;
          return list;
        }
      } catch (err) {
        console.warn('Backend unavailable for getAttendance:', err);
      }
    }
    await new Promise(res => setTimeout(res, 30));
    let filtered = [...attendanceState];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        a =>
          a.employeeName.toLowerCase().includes(q) ||
          a.employeeCode.toLowerCase().includes(q)
      );
    }

    if (params.department && params.department !== 'all') {
      filtered = filtered.filter(a => a.department === params.department);
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(a => a.status === params.status);
    }

    if (params.date) {
      filtered = filtered.filter(a => a.date === params.date);
    }

    return filtered;
  },

  async getAttendanceStats() {
    await new Promise(res => setTimeout(res, 20));
    const total = attendanceState.length;
    const present = attendanceState.filter(a => a.status === 'present').length;
    const late = attendanceState.filter(a => a.status === 'late').length;
    const absent = attendanceState.filter(a => a.status === 'absent').length;
    const onLeave = attendanceState.filter(a => a.status === 'leave').length;

    return {
      total,
      present,
      late,
      absent,
      onLeave,
      attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 100,
    };
  },

  async recordAttendance(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.post<any>('/attendance', data);
        const created = res?.data || res;
        if (created && created.id) {
          attendanceState.unshift(created);
          return created;
        }
      } catch (err) {
        console.warn('Backend recordAttendance failed, applying locally:', err);
      }
    }
    await new Promise(res => setTimeout(res, 30));
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: data.employeeId || '',
      employeeName: data.employeeName || '',
      employeeCode: data.employeeCode || '',
      department: data.department || '',
      date: data.date || new Date().toISOString().split('T')[0],
      checkIn: data.checkIn || '08:30',
      checkOut: data.checkOut,
      status: data.status || 'present',
      workHours: data.workHours || 8,
    };
    attendanceState.unshift(newRecord);
    return newRecord;
  },
};
