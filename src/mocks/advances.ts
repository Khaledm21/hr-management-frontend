import { AdvanceItem, AdvanceStatus } from '../types';
import { mockEmployees } from './employees';

function generateAdvances(): AdvanceItem[] {
  const items: AdvanceItem[] = [];
  const purposes = [
    'Urgent family home renovation and repair',
    'Children school tuition fees annual payment',
    'Personal medical procedure for dependent',
    'Vehicle down payment and registration',
    'Annual residential rental lease installment',
  ];

  mockEmployees.slice(0, 30).forEach((emp, idx) => {
    let status: AdvanceStatus = 'completed';
    if (idx % 3 === 0) status = 'pending';
    else if (idx % 5 === 0) status = 'approved';
    else if (idx % 7 === 0) status = 'paid';
    else if (idx % 11 === 0) status = 'rejected';

    const amount = 5000 + (idx % 6) * 2500;
    const installmentsCount = (idx % 3 === 0 ? 3 : idx % 2 === 0 ? 6 : 10);
    const installmentAmount = Math.round(amount / installmentsCount);
    const remainingBalance = status === 'completed' ? 0 : status === 'paid' ? Math.round(amount * 0.6) : amount;

    items.push({
      id: `adv-${idx + 101}`,
      advanceNumber: `ADV-2026-${String(idx + 101).padStart(4, '0')}`,
      employeeId: emp.id,
      employeeCode: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.departmentName,
      amount,
      installmentsCount,
      installmentAmount,
      remainingBalance,
      purpose: purposes[idx % purposes.length],
      status,
      requestedAt: `2026-03-${String(10 + (idx % 15)).padStart(2, '0')}`,
      approvedAt: status !== 'pending' && status !== 'rejected' ? '2026-03-24' : undefined,
    });
  });

  return items;
}

export const mockAdvances: AdvanceItem[] = generateAdvances();
