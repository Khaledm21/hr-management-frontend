import { EmploymentHistoryEvent } from '../types';

export const mockEmploymentHistory: EmploymentHistoryEvent[] = [
  {
    id: 'hist-01',
    employeeId: 'emp-0001',
    date: '2026-01-15',
    eventType: 'promotion',
    previousValue: 'Senior Software Engineer',
    newValue: 'Lead Software Architect',
    changedBy: 'Executive Committee',
    notes: 'Promoted based on exceptional technical leadership in Core Platform migration.',
  },
  {
    id: 'hist-02',
    employeeId: 'emp-0001',
    date: '2026-01-15',
    eventType: 'salary_change',
    previousValue: 'SAR 22,000 / month',
    newValue: 'SAR 28,000 / month',
    changedBy: 'Sarah Al-Ghamdi (HR Director)',
    notes: 'Annual compensation benchmarking and promotion adjustment.',
  },
  {
    id: 'hist-03',
    employeeId: 'emp-0001',
    date: '2025-06-01',
    eventType: 'contract_renewal',
    previousValue: 'Fixed-Term (2 Years)',
    newValue: 'Fixed-Term Renewal (2 Years)',
    changedBy: 'HR Operations',
    notes: 'Contract successfully renewed for a two-year extension.',
  },
  {
    id: 'hist-04',
    employeeId: 'emp-0001',
    date: '2024-03-10',
    eventType: 'department_transfer',
    previousValue: 'Product & Design',
    newValue: 'Engineering & Technology',
    changedBy: 'CTO Office',
    notes: 'Internal reorganization of frontend architecture guild.',
  },
  {
    id: 'hist-05',
    employeeId: 'emp-0001',
    date: '2022-04-01',
    eventType: 'hired',
    previousValue: 'N/A',
    newValue: 'Software Engineer',
    changedBy: 'Recruitment Team',
    notes: 'Initial hire onboarding completed. Completed 90-day probationary evaluation.',
  },
  // Generic helper to get history for any employee
];

export function getEmployeeHistory(employeeId: string): EmploymentHistoryEvent[] {
  const specific = mockEmploymentHistory.filter(h => h.employeeId === employeeId);
  if (specific.length > 0) return specific;

  // Generate standard timeline for other employees
  return [
    {
      id: `hist-gen-1-${employeeId}`,
      employeeId,
      date: '2025-01-10',
      eventType: 'salary_change',
      previousValue: 'SAR 14,000 / month',
      newValue: 'SAR 16,500 / month',
      changedBy: 'HR Compensation Committee',
      notes: 'Annual merit increase adjustment.',
    },
    {
      id: `hist-gen-2-${employeeId}`,
      employeeId,
      date: '2024-05-15',
      eventType: 'contract_renewal',
      previousValue: 'Initial Contract',
      newValue: 'Renewed Employment Term',
      changedBy: 'HR Operations',
      notes: 'Bylaw renewal approval.',
    },
    {
      id: `hist-gen-3-${employeeId}`,
      employeeId,
      date: '2023-02-01',
      eventType: 'hired',
      previousValue: 'External Candidate',
      newValue: 'Full-Time Employment',
      changedBy: 'HR Talent Acquisition',
      notes: 'Candidate completed recruitment and probationary milestone with distinction.',
    },
  ];
}
