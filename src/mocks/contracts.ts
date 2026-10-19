import { ContractRecord, ContractType, ContractStatus } from '../types';
import { mockEmployees } from './employees';

function generateContracts(): ContractRecord[] {
  return mockEmployees.map((emp, idx) => {
    let type: ContractType = 'fixed_term';
    if (idx % 3 === 0) type = 'indefinite';
    else if (idx % 19 === 0) type = 'consultancy';
    else if (emp.employmentStatus === 'probation') type = 'probation';

    let status: ContractStatus = emp.contractStatus;
    const startYear = parseInt(emp.hireDate.split('-')[0], 10);
    const startDate = `${startYear}-01-01`;
    let endDate = `${startYear + 2}-12-31`;

    if (status === 'expiring_soon') {
      endDate = '2026-04-30'; // within 30 days
    } else if (status === 'expired') {
      endDate = '2026-02-28';
    } else if (status === 'pending_renewal') {
      endDate = '2026-05-15';
    } else {
      endDate = '2027-12-31';
    }

    return {
      id: `cnt-${emp.id}`,
      contractNumber: `CNT-2025-${String(idx + 1001)}`,
      employeeId: emp.id,
      employeeCode: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.departmentName,
      type,
      startDate,
      endDate: type === 'indefinite' ? 'N/A (Indefinite)' : endDate,
      status,
      salary: emp.basicSalary + emp.housingAllowance + emp.transportAllowance,
      noticePeriodDays: type === 'consultancy' ? 30 : 60,
      renewalCount: Math.max(0, 2026 - startYear),
      termsSummary: 'Standard employment agreement subject to Saudi Labor Law and company bylaws.',
    };
  });
}

export const mockContracts: ContractRecord[] = generateContracts();
