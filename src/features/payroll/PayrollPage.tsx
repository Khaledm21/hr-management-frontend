import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Shield,
  Eye,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { payrollService } from '../../services/payrollService';
import { departmentService } from '../../services/departmentService';
import { PayrollItem, PayrollPeriodSummary, PayrollStatus, Department } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../components/ui/Toast';

export const PayrollPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can, role, user } = useAuth();
  const { success } = useToast();

  const [summaries, setSummaries] = useState<PayrollPeriodSummary[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-03');
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const currentSummary = useMemo(
    () => summaries.find(s => s.period === selectedPeriod) || summaries[0],
    [summaries, selectedPeriod]
  );

  const fetchPayroll = async () => {
    setIsLoading(true);
    try {
      const [sumList, itemList] = await Promise.all([
        payrollService.getPayrollSummaries(),
        payrollService.getPayrollItems({
          period: selectedPeriod,
          department: selectedDept !== 'all' ? selectedDept : undefined,
          status: selectedStatus as any,
        }),
      ]);
      setSummaries(sumList);
      setItems(itemList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (can('payroll', 'view')) {
      fetchPayroll();
    } else {
      setIsLoading(false);
    }
  }, [selectedPeriod, selectedDept, selectedStatus]);

  useEffect(() => {
    departmentService.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const handleLockAndApprove = async () => {
    await payrollService.updatePeriodStatus(selectedPeriod, 'locked', user?.name || 'HR Director');
    success(`Payroll for period ${selectedPeriod} has been successfully locked and authorized for bank WPS disbursement.`, 'Payroll Locked');
    await fetchPayroll();
  };

  const getStatusBadge = (status: PayrollStatus) => {
    const map: Record<PayrollStatus, { label: string; variant: any }> = {
      draft: { label: 'Draft Run', variant: 'secondary' },
      under_review: { label: 'Under Review', variant: 'warning' },
      approved: { label: 'Approved', variant: 'info' },
      locked: { label: 'Locked & Disbursed', variant: 'success' },
    };
    const s = map[status] || { label: status, variant: 'default' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const columns: Column<PayrollItem>[] = useMemo(
    () => [
      {
        key: 'employeeName',
        header: 'Employee',
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block">{row.employeeName}</span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{row.employeeCode}</span>
          </div>
        ),
      },
      {
        key: 'department',
        header: 'Department',
        sortable: true,
        render: row => <span className="text-slate-600 dark:text-slate-400 font-medium">{row.department}</span>,
      },
      {
        key: 'basicSalary',
        header: t('payroll.basicSalary'),
        sortable: true,
        render: row => (
          <span className="font-mono text-slate-700 dark:text-slate-300">SAR {row.basicSalary.toLocaleString()}</span>
        ),
      },
      {
        key: 'allowances',
        header: t('payroll.allowances'),
        sortable: true,
        accessor: row => row.housingAllowance + row.transportAllowance + row.otherAllowances,
        render: row => (
          <span className="font-mono text-slate-700 dark:text-slate-300">
            SAR {(row.housingAllowance + row.transportAllowance + row.otherAllowances).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'totalDeductions',
        header: t('payroll.deductions'),
        sortable: true,
        render: row => (
          <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">
            - SAR {row.totalDeductions.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'netSalary',
        header: t('payroll.netSalary'),
        sortable: true,
        render: row => (
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
            SAR {row.netSalary.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Run Status',
        sortable: true,
        render: row => getStatusBadge(row.status),
      },
      {
        key: 'actions',
        header: 'Payslip',
        align: 'right',
        render: row => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/payroll/${row.period}?employee=${row.employeeId}`)}
          >
            Slip
          </Button>
        ),
      },
    ],
    [navigate, t]
  );

  if (!can('payroll', 'view')) {
    return (
      <div className="text-center py-16 bg-white dark:bg-[#151D2E] rounded-2xl border border-slate-200 dark:border-[#1E293B]">
        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">Restricted Payroll Domain</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          {t('payroll.restrictedNotice')} Current persona ({role}) has no payroll access permissions.
          Please switch to HR Manager or System Admin in the top header.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            {t('payroll.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('payroll.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-3 py-2 text-slate-800 dark:text-[#F8FAFC] shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:focus:ring-[#38BDF8] cursor-pointer"
          >
            {summaries.map(s => (
              <option key={s.period} value={s.period}>
                Period {s.period} ({s.status.toUpperCase()})
              </option>
            ))}
          </select>

          {currentSummary && currentSummary.status !== 'locked' && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Lock className="w-4 h-4" />}
              onClick={handleLockAndApprove}
            >
              {t('payroll.lockPayroll')}
            </Button>
          )}
        </div>
      </div>

      {/* Payroll KPI Cards */}
      {currentSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('payroll.currentPeriod')}
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1 block">
                {currentSummary.period}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {currentSummary.totalEmployees} Active Salaried
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('payroll.grossPayroll')}
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1 block">
                SAR {(currentSummary.grossTotal / 1000).toLocaleString()}k
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Basic + Housing + Transport</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('payroll.deductions')}
              </span>
              <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                - SAR {(currentSummary.deductionsTotal / 1000).toLocaleString()}k
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">GOSI & Advance deductions</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('payroll.netPayroll')}
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                SAR {(currentSummary.netTotal / 1000).toLocaleString()}k
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                WPS Disbursement Total
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Table */}
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search employee name or code in payroll..."
        exportFilename={`Payroll_Period_${selectedPeriod}`}
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 dark:focus:ring-[#38BDF8] cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 dark:focus:ring-[#38BDF8] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
