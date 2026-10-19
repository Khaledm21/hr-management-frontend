import { PayrollItem, PayrollPeriodSummary, PayrollStatus } from '../types';
import { mockEmployees } from './employees';

export const mockPayrollSummaries: PayrollPeriodSummary[] = [
  {
    period: '2026-03',
    totalEmployees: 312,
    grossTotal: 6240000,
    deductionsTotal: 624000,
    netTotal: 5616000,
    status: 'under_review',
    payDate: '2026-03-31',
  },
  {
    period: '2026-02',
    totalEmployees: 308,
    grossTotal: 6160000,
    deductionsTotal: 616000,
    netTotal: 5544000,
    status: 'locked',
    lockedAt: '2026-02-28 17:00',
    approvedBy: 'Fahad Al-Otaibi (Finance Director)',
    payDate: '2026-02-28',
  },
  {
    period: '2026-01',
    totalEmployees: 304,
    grossTotal: 6080000,
    deductionsTotal: 608000,
    netTotal: 5472000,
    status: 'locked',
    lockedAt: '2026-01-31 16:30',
    approvedBy: 'Fahad Al-Otaibi (Finance Director)',
    payDate: '2026-01-31',
  },
];

export function generatePayrollItems(period: string = '2026-03'): PayrollItem[] {
  const summary = mockPayrollSummaries.find(s => s.period === period) || mockPayrollSummaries[0];

  return mockEmployees.map((emp, idx) => {
    const basicSalary = emp.basicSalary;
    const housing = emp.housingAllowance;
    const transport = emp.transportAllowance;
    const otherAllowances = idx % 4 === 0 ? 1200 : 0;
    const gross = basicSalary + housing + transport + otherAllowances;

    const gosiTax = Math.round(basicSalary * 0.0975); // GOSI social security
    const advances = idx % 8 === 0 ? 2500 : 0;
    const totalDeductions = gosiTax + advances;
    const net = gross - totalDeductions;

    let status: PayrollStatus = summary.status;

    return {
      id: `pay-${period}-${emp.id}`,
      employeeId: emp.id,
      employeeCode: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.departmentName,
      period,
      basicSalary,
      housingAllowance: housing,
      transportAllowance: transport,
      otherAllowances,
      grossSalary: gross,
      taxDeduction: 0,
      insuranceDeduction: gosiTax,
      advancesDeduction: advances,
      totalDeductions,
      netSalary: net,
      status,
      paymentMethod: 'WPS Direct Bank Deposit (Alinma Bank)',
    };
  });
}

export const mockPayrollRecords: PayrollItem[] = generatePayrollItems('2026-03');
