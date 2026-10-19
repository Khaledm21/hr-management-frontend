import { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '../types';
import { mockEmployees } from './employees';

function generateLeaveBalances(): LeaveBalance[] {
  return mockEmployees.map((emp, idx) => {
    const annualTotal = 30;
    const annualUsed = Math.min(28, (idx * 3) % 24);
    const annualRemaining = annualTotal - annualUsed;

    const sickTotal = 15;
    const sickUsed = (idx * 2) % 6;

    const emergencyTotal = 5;
    const emergencyUsed = idx % 3;

    return {
      id: `lb-${emp.id}`,
      employeeId: emp.id,
      employeeCode: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.departmentName,
      annualTotal,
      annualUsed,
      annualRemaining,
      sickTotal,
      sickUsed,
      emergencyTotal,
      emergencyUsed,
      unpaidUsed: idx % 15 === 0 ? 3 : 0,
    };
  });
}

function generateLeaveRequests(): LeaveRequest[] {
  const requests: LeaveRequest[] = [];
  const leaveTypes: LeaveType[] = ['annual', 'sick', 'emergency', 'unpaid', 'maternity'];
  const reasons = [
    'Annual family holiday trip',
    'Severe influenza and doctor advised bed rest',
    'Family emergency attending to elderly parent',
    'Personal errands and bank appointments',
    'Post-surgery recovery recommended by physician',
  ];

  mockEmployees.slice(0, 45).forEach((emp, idx) => {
    const leaveType = leaveTypes[idx % leaveTypes.length];
    let status: LeaveStatus = 'approved';
    if (idx % 4 === 0) status = 'pending';
    else if (idx % 9 === 0) status = 'rejected';
    else if (idx % 14 === 0) status = 'cancelled';

    const days = 1 + (idx % 7);
    const startDay = 10 + (idx % 15);

    requests.push({
      id: `lr-${idx + 100}`,
      employeeId: emp.id,
      employeeCode: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.departmentName,
      leaveType,
      startDate: `2026-04-${String(startDay).padStart(2, '0')}`,
      endDate: `2026-04-${String(startDay + days).padStart(2, '0')}`,
      days,
      reason: reasons[idx % reasons.length],
      status,
      approverId: emp.managerId,
      approverName: emp.managerName,
      submittedAt: `2026-03-${String(15 + (idx % 12)).padStart(2, '0')} 09:30`,
      decisionAt: status !== 'pending' ? '2026-03-28 14:15' : undefined,
      comments: status === 'rejected' ? 'Current operational workload during sprint deliverables precludes extended leaves this week.' : 'Approved. Please coordinate handover before departure.',
    });
  });

  return requests;
}

export const mockLeaveBalances: LeaveBalance[] = generateLeaveBalances();
export const mockLeaveRequests: LeaveRequest[] = generateLeaveRequests();
