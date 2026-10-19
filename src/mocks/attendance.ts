import { AttendanceRecord, AttendanceStatus } from '../types';
import { mockEmployees } from './employees';

function generateAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const todayStr = '2026-03-30';

  mockEmployees.forEach((emp, idx) => {
    let status: AttendanceStatus = 'present';
    let checkIn = '08:52 AM';
    let checkOut = '05:04 PM';
    let lateMinutes = 0;
    let earlyDepartureMinutes = 0;
    let overtimeHours = 0;
    let workHours = 8.2;

    if (emp.employmentStatus === 'on_leave') {
      status = 'leave';
      checkIn = '-';
      checkOut = '-';
      workHours = 0;
    } else if (idx % 19 === 0) {
      status = 'absent';
      checkIn = '-';
      checkOut = '-';
      workHours = 0;
    } else if (idx % 7 === 0) {
      status = 'late';
      checkIn = '09:28 AM';
      checkOut = '05:30 PM';
      lateMinutes = 28;
      workHours = 8.0;
    } else if (idx % 11 === 0) {
      status = 'present';
      checkIn = '08:45 AM';
      checkOut = '06:45 PM';
      overtimeHours = 1.75;
      workHours = 10.0;
    } else if (idx % 13 === 0) {
      status = 'present';
      checkIn = '08:50 AM';
      checkOut = '04:15 PM';
      earlyDepartureMinutes = 45;
      workHours = 7.25;
    }

    records.push({
      id: `att-${emp.id}-${todayStr}`,
      employeeId: emp.id,
      employeeCode: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.departmentName,
      date: todayStr,
      checkIn,
      checkOut,
      workHours,
      overtimeHours,
      status,
      lateMinutes,
      earlyDepartureMinutes,
      deviceSource: idx % 2 === 0 ? 'BioMetric-Terminal-Turnstile-01' : 'Mobile-Geofence-Punch-02',
    });
  });

  return records;
}

export const mockAttendanceRecords: AttendanceRecord[] = generateAttendance();
