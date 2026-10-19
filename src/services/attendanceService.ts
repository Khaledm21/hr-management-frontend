import { AttendanceRecord, AttendanceStatus } from '../types';
import { mockAttendanceRecords } from '../mocks/attendance';

let attendanceState = [...mockAttendanceRecords];

export interface AttendanceFilterParams {
  search?: string;
  department?: string;
  status?: AttendanceStatus | 'all';
  date?: string;
}

export const attendanceService = {
  async getAttendance(params: AttendanceFilterParams = {}): Promise<AttendanceRecord[]> {
    await new Promise(res => setTimeout(res, 50));
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
    await new Promise(res => setTimeout(res, 30));
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
      attendanceRate: Math.round(((present + late) / (total || 1)) * 100),
    };
  },
};
