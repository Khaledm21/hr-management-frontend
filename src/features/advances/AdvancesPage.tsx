import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Banknote,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  CreditCard,
  Building,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { advanceService } from '../../services/advanceService';
import { AdvanceItem, AdvanceStatus } from '../../types';
import { useToast } from '../../components/ui/Toast';

export const AdvancesPage: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  const [advances, setAdvances] = useState<AdvanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  // New advance form
  const [empName, setEmpName] = useState('Mohammed Al-Ghamdi');
  const [empDept, setEmpDept] = useState('Engineering & Technology');
  const [amount, setAmount] = useState(15000);
  const [installments, setInstallments] = useState(6);
  const [purpose, setPurpose] = useState('Annual residential lease payment');

  const fetchAdvances = async () => {
    setIsLoading(true);
    try {
      const data = await advanceService.getAdvances(selectedStatus as any);
      setAdvances(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvances();
  }, [selectedStatus]);

  const handleApprove = async (adv: AdvanceItem) => {
    await advanceService.approveAdvance(adv.id);
    success(`Advance ${adv.advanceNumber} approved for SAR ${adv.amount.toLocaleString()}.`, 'Approved');
    await fetchAdvances();
  };

  const handleReject = async (adv: AdvanceItem) => {
    await advanceService.rejectAdvance(adv.id);
    toastError(`Advance ${adv.advanceNumber} rejected.`, 'Rejected');
    await fetchAdvances();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await advanceService.createAdvance({
      employeeId: 'emp-0001',
      employeeCode: 'HR-1001',
      employeeName: empName,
      department: empDept,
      amount,
      installmentsCount: installments,
      purpose,
    });
    success('Advance request submitted for finance verification.', 'Request Submitted');
    setIsRequestOpen(false);
    await fetchAdvances();
  };

  const getStatusBadge = (status: AdvanceStatus) => {
    const map: Record<AdvanceStatus, { label: string; variant: any }> = {
      pending: { label: 'Pending Review', variant: 'warning' },
      approved: { label: 'Approved', variant: 'info' },
      paid: { label: 'Disbursed (Active Deduction)', variant: 'success' },
      completed: { label: 'Fully Repaid', variant: 'secondary' },
      rejected: { label: 'Rejected', variant: 'danger' },
    };
    const s = map[status] || { label: status, variant: 'default' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const columns: Column<AdvanceItem>[] = useMemo(
    () => [
      {
        key: 'advanceNumber',
        header: t('advances.advanceNo'),
        sortable: true,
        width: '130px',
        render: row => (
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#0B0F19] px-2 py-0.5 rounded text-xs border border-transparent dark:border-[#1E293B]">
            {row.advanceNumber}
          </span>
        ),
      },
      {
        key: 'employeeName',
        header: 'Employee',
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block">{row.employeeName}</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{row.department}</span>
          </div>
        ),
      },
      {
        key: 'amount',
        header: t('advances.amount'),
        sortable: true,
        render: row => (
          <span className="font-bold text-slate-900 dark:text-[#F8FAFC] font-mono">
            SAR {row.amount.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'installmentsCount',
        header: t('advances.installments'),
        sortable: true,
        render: row => (
          <span className="text-slate-700 dark:text-slate-300 font-mono">
            {row.installmentsCount} mos ({Math.round(row.amount / row.installmentsCount).toLocaleString()} / mo)
          </span>
        ),
      },
      {
        key: 'remainingBalance',
        header: t('advances.remaining'),
        sortable: true,
        render: row => (
          <span className="font-mono font-semibold text-rose-700 dark:text-rose-400">
            SAR {row.remainingBalance.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'purpose',
        header: t('advances.purpose'),
        render: row => <span className="text-slate-600 dark:text-slate-400 line-clamp-1">{row.purpose}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: row => getStatusBadge(row.status),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end gap-1.5">
            {row.status === 'pending' && (
              <>
                <button
                  onClick={() => handleApprove(row)}
                  className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                  title="Approve"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReject(row)}
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Reject"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            {t('advances.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('advances.subtitle')}</p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsRequestOpen(true)}
        >
          {t('advances.requestAdvance')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={advances}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search advance # or employee..."
        exportFilename="Apex_Enterprise_Salary_Advances"
        filtersSlot={
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 dark:focus:ring-[#38BDF8] cursor-pointer"
          >
            <option value="all">All Advance Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Disbursed (Active)</option>
            <option value="completed">Completed (Repaid)</option>
            <option value="rejected">Rejected</option>
          </select>
        }
      />

      {/* New Advance Request Modal */}
      {isRequestOpen && (
        <Modal
          isOpen={isRequestOpen}
          onClose={() => setIsRequestOpen(false)}
          size="md"
          title="Apply for Salary Advance"
          description="Request a salary advance subject to monthly payroll deductions"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <Input
              label="Employee Name"
              required
              value={empName}
              onChange={e => setEmpName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Requested Amount (SAR)"
                type="number"
                required
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
              />
              <Input
                label="Repayment Months"
                type="number"
                required
                value={installments}
                onChange={e => setInstallments(Number(e.target.value))}
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] rounded-xl border border-slate-200 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Estimated Monthly Deduction:</span>
              <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block text-sm mt-0.5 font-mono">
                SAR {Math.round(amount / (installments || 1)).toLocaleString()} / month
              </span>
            </div>
            <Input
              label="Stated Purpose / Need"
              required
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsRequestOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Submit Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
