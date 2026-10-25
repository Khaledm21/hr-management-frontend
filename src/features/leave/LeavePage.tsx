import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Scale,
  Calendar,
  Filter,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { leaveService } from '../../services/leaveService';
import { mockDepartments } from '../../mocks/departments';
import { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '../../types';
import { useToast } from '../../components/ui/Toast';

export const LeavePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'requests' | 'balances'>('requests');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<LeaveRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalComment, setApprovalComment] = useState('');

  // New Request Form
  const [newEmployeeName, setNewEmployeeName] = useState('Mohammed Al-Ghamdi');
  const [newDept, setNewDept] = useState('Engineering & Technology');
  const [newType, setNewType] = useState<LeaveType>('annual');
  const [newStartDate, setNewStartDate] = useState('2026-04-10');
  const [newEndDate, setNewEndDate] = useState('2026-04-15');
  const [newDays, setNewDays] = useState(5);
  const [newReason, setNewReason] = useState('Family annual vacation');

  const getDeptName = (deptName: string) => {
    const d = mockDepartments.find(
      item => item.name === deptName || item.nameAr === deptName || item.code === deptName
    );
    if (!d) return deptName;
    if (i18n.language === 'ar') return d.nameAr || d.name;
    if (i18n.language.startsWith('zh')) return d.nameZh || d.name;
    return d.name;
  };

  const getReasonText = (reason: string) => {
    const reasonMap: Record<string, { ar: string; zh: string }> = {
      'Annual family holiday trip': { ar: 'إجازة عائلية سنوية', zh: '年度家庭度假旅行' },
      'Severe influenza and doctor advised bed rest': { ar: 'إنفلونزا حادة وراحة طبية بتوصية الطبيب', zh: '重感冒遵医嘱卧床休息' },
      'Family emergency attending to elderly parent': { ar: 'ظرف عائلي طارئ لرعاية أحد الوالدين', zh: '家庭紧急情况照顾年迈父母' },
      'Personal errands and bank appointments': { ar: 'معاملات شخصية ومواعيد بنكية', zh: '个人事务与银行预约' },
      'Post-surgery recovery recommended by physician': { ar: 'فترة نقاهة بعد عملية جراحية بتوصية الطبيب', zh: '术后按医生建议康复休养' },
      'Family annual vacation': { ar: 'إجازة سنوية عائلية', zh: '家庭年度假期' },
    };
    if (i18n.language === 'ar' && reasonMap[reason]?.ar) return reasonMap[reason].ar;
    if (i18n.language.startsWith('zh') && reasonMap[reason]?.zh) return reasonMap[reason].zh;
    return reason;
  };

  const fetchLeaveData = async () => {
    setIsLoading(true);
    try {
      const [reqs, bals] = await Promise.all([
        leaveService.getLeaveRequests({
          department: selectedDept !== 'all' ? selectedDept : undefined,
          status: selectedStatus as any,
          leaveType: selectedType as any,
        }),
        leaveService.getLeaveBalances(undefined, selectedDept !== 'all' ? selectedDept : undefined),
      ]);
      setRequests(reqs);
      setBalances(bals);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [selectedDept, selectedStatus, selectedType]);

  const handleConfirmApprove = async () => {
    if (!approvingRequest) return;
    await leaveService.approveLeave(approvingRequest.id, approvalComment);
    success(
      t('leave.approveSuccess', { name: approvingRequest.employeeName }),
      t('leave.approveSuccessTitle')
    );
    setApprovingRequest(null);
    setApprovalComment('');
    await fetchLeaveData();
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest || !rejectReason.trim()) return;
    await leaveService.rejectLeave(rejectingRequest.id, rejectReason);
    toastError(
      t('leave.rejectError', { reason: rejectReason }),
      t('leave.rejectErrorTitle')
    );
    setRejectingRequest(null);
    setRejectReason('');
    await fetchLeaveData();
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await leaveService.createLeaveRequest({
      employeeId: 'emp-0001',
      employeeCode: 'HR-1001',
      employeeName: newEmployeeName,
      department: newDept,
      leaveType: newType,
      startDate: newStartDate,
      endDate: newEndDate,
      days: newDays,
      reason: newReason,
      approverName: 'Sarah Al-Ghamdi',
    });
    success(t('leave.createSuccess'), t('leave.createSuccessTitle'));
    setIsNewRequestOpen(false);
    await fetchLeaveData();
  };

  const requestColumns: Column<LeaveRequest>[] = useMemo(
    () => [
      {
        key: 'employeeName',
        header: t('leave.employee'),
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
        header: t('leave.department'),
        sortable: true,
        render: row => <span className="text-slate-600 dark:text-slate-400 font-medium">{getDeptName(row.department)}</span>,
      },
      {
        key: 'leaveType',
        header: t('leave.leaveType'),
        sortable: true,
        render: row => (
          <span className="uppercase text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#0B0F19] px-2 py-0.5 rounded border border-transparent dark:border-[#1E293B]">
            {t(`leave.${row.leaveType}` as any) || row.leaveType}
          </span>
        ),
      },
      {
        key: 'dates',
        header: t('leave.leaveDuration'),
        sortable: true,
        accessor: row => row.startDate,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block font-mono">
              {row.startDate} {t('leave.to')} {row.endDate}
            </span>
            <span className="text-[11px] text-brand-600 dark:text-[#38BDF8] font-medium">
              {t('leave.calendarDays', { count: row.days })}
            </span>
          </div>
        ),
      },
      {
        key: 'reason',
        header: t('leave.statedPurpose'),
        render: row => <span className="text-slate-600 dark:text-slate-400 text-xs line-clamp-1">{getReasonText(row.reason)}</span>,
      },
      {
        key: 'status',
        header: t('leave.workflowStatus'),
        sortable: true,
        render: row => {
          if (row.status === 'approved') return <Badge variant="success">{t('leave.statusApproved')}</Badge>;
          if (row.status === 'pending') return <Badge variant="warning">{t('leave.statusPending')}</Badge>;
          if (row.status === 'rejected') return <Badge variant="danger">{t('leave.statusRejected')}</Badge>;
          return <Badge variant="secondary">{t('leave.statusCancelled')}</Badge>;
        },
      },
      {
        key: 'approverName',
        header: t('leave.approver'),
        render: row => <span className="text-slate-500 dark:text-slate-400 text-xs">{row.approverName || '-'}</span>,
      },
      {
        key: 'actions',
        header: t('leave.actions'),
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end gap-1.5">
            {row.status === 'pending' && (
              <>
                <button
                  onClick={() => setApprovingRequest(row)}
                  className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                  title={t('leave.approveTooltip')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRejectingRequest(row)}
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title={t('leave.rejectTooltip')}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [t, i18n.language]
  );

  const balanceColumns: Column<LeaveBalance>[] = useMemo(
    () => [
      {
        key: 'employeeName',
        header: t('leave.employee'),
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
        header: t('leave.department'),
        sortable: true,
        render: row => <span className="text-slate-600 dark:text-slate-400 font-medium">{getDeptName(row.department)}</span>,
      },
      {
        key: 'annualTotal',
        header: t('leave.annualAllotted'),
        sortable: true,
        render: row => (
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {t('leave.daysUnit', { count: row.annualTotal })}
          </span>
        ),
      },
      {
        key: 'annualUsed',
        header: t('leave.annualUsed'),
        sortable: true,
        render: row => (
          <span className="text-amber-700 dark:text-amber-400 font-medium">
            {t('leave.daysUnit', { count: row.annualUsed })}
          </span>
        ),
      },
      {
        key: 'annualRemaining',
        header: t('leave.annualBalance'),
        sortable: true,
        render: row => (
          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-transparent dark:border-emerald-800/40">
            {t('leave.daysUnit', { count: row.annualRemaining })}
          </span>
        ),
      },
      {
        key: 'sickUsed',
        header: t('leave.sickDaysUsed'),
        sortable: true,
        render: row => <span className="text-slate-600 dark:text-slate-400 font-mono">{row.sickUsed} / {row.sickTotal}</span>,
      },
      {
        key: 'emergencyUsed',
        header: t('leave.casualDaysUsed'),
        sortable: true,
        render: row => <span className="text-slate-600 dark:text-slate-400 font-mono">{row.emergencyUsed} / {row.emergencyTotal}</span>,
      },
    ],
    [t, i18n.language]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            {t('leave.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('leave.subtitle')}</p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsNewRequestOpen(true)}
        >
          {t('leave.requestLeave')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'requests', label: t('nav.leaveRequests'), icon: <CalendarDays className="w-4 h-4" /> },
          { id: 'balances', label: t('nav.leaveBalances'), icon: <Scale className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={tab => setActiveTab(tab as any)}
      />

      {activeTab === 'requests' ? (
        <DataTable
          columns={requestColumns}
          data={requests}
          keyExtractor={row => row.id}
          isLoading={isLoading}
          searchable
          searchPlaceholder={t('leave.searchRequestsPlaceholder')}
          exportFilename="Apex_Enterprise_Leave_Requests"
          filtersSlot={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 dark:focus:ring-[#38BDF8] cursor-pointer"
              >
                <option value="all">{t('leave.allDepartments')}</option>
                {mockDepartments.map(d => (
                  <option key={d.id} value={d.name}>
                    {i18n.language === 'ar' ? (d.nameAr || d.name) : (i18n.language.startsWith('zh') ? (d.nameZh || d.name) : d.name)}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 dark:focus:ring-[#38BDF8] cursor-pointer"
              >
                <option value="all">{t('leave.allStatuses')}</option>
                <option value="pending">{t('leave.statusPending')}</option>
                <option value="approved">{t('leave.statusApproved')}</option>
                <option value="rejected">{t('leave.statusRejected')}</option>
              </select>

              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 dark:focus:ring-[#38BDF8] cursor-pointer"
              >
                <option value="all">{t('leave.allTypes')}</option>
                <option value="annual">{t('leave.annual')}</option>
                <option value="sick">{t('leave.sick')}</option>
                <option value="emergency">{t('leave.emergency')}</option>
                <option value="unpaid">{t('leave.unpaid')}</option>
                <option value="maternity">{t('leave.maternity')}</option>
              </select>
            </div>
          }
        />
      ) : (
        <DataTable
          columns={balanceColumns}
          data={balances}
          keyExtractor={row => row.id}
          isLoading={isLoading}
          searchable
          searchPlaceholder={t('leave.searchBalancesPlaceholder')}
          exportFilename="Apex_Enterprise_Leave_Balances_Accruals"
        />
      )}

      {/* Approve Modal */}
      {approvingRequest && (
        <Modal
          isOpen={!!approvingRequest}
          onClose={() => setApprovingRequest(null)}
          size="md"
          title={t('leave.approveModalTitle')}
          description={t('leave.approveModalDesc', {
            days: approvingRequest.days,
            type: t(`leave.${approvingRequest.leaveType}` as any) || approvingRequest.leaveType,
            name: approvingRequest.employeeName,
          })}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setApprovingRequest(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="success" size="sm" onClick={handleConfirmApprove}>
                {t('leave.signAndApproveBtn')}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] rounded-xl border border-slate-200 dark:border-[#1E293B]">
              <p className="font-semibold text-slate-800 dark:text-[#F8FAFC] font-mono">
                {t('leave.periodLabel', {
                  start: approvingRequest.startDate,
                  end: approvingRequest.endDate,
                })}
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {t('leave.reasonLabel', { reason: getReasonText(approvingRequest.reason) })}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('leave.approvalRemarksLabel')}
              </label>
              <input
                type="text"
                value={approvalComment}
                onChange={e => setApprovalComment(e.target.value)}
                placeholder={t('leave.approvalRemarksPlaceholder')}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectingRequest && (
        <Modal
          isOpen={!!rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          size="md"
          title={t('leave.rejectModalTitle')}
          description={t('leave.rejectModalDesc', { name: rejectingRequest.employeeName })}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setRejectingRequest(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
              >
                {t('leave.confirmRejectionBtn')}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('leave.rejectJustificationLabel')}
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={t('leave.rejectJustificationPlaceholder')}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-[#F8FAFC] p-3 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </Modal>
      )}

      {/* New Request Modal */}
      {isNewRequestOpen && (
        <Modal
          isOpen={isNewRequestOpen}
          onClose={() => setIsNewRequestOpen(false)}
          size="md"
          title={t('leave.newRequestTitle')}
          description={t('leave.newRequestDesc')}
        >
          <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
            <Input
              label={t('leave.employeeNameLabel')}
              required
              value={newEmployeeName}
              onChange={e => setNewEmployeeName(e.target.value)}
            />
            <Select
              label={t('leave.leaveClassificationLabel')}
              required
              value={newType}
              onChange={e => setNewType(e.target.value as LeaveType)}
              options={[
                { value: 'annual', label: t('leave.typeAnnual') },
                { value: 'sick', label: t('leave.typeSick') },
                { value: 'emergency', label: t('leave.typeEmergency') },
                { value: 'unpaid', label: t('leave.typeUnpaid') },
                { value: 'maternity', label: t('leave.typeMaternity') },
                { value: 'other', label: t('leave.typeOther') },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('leave.startDateLabel')}
                type="date"
                required
                value={newStartDate}
                onChange={e => setNewStartDate(e.target.value)}
              />
              <Input
                label={t('leave.endDateLabel')}
                type="date"
                required
                value={newEndDate}
                onChange={e => setNewEndDate(e.target.value)}
              />
            </div>
            <Input
              label={t('leave.daysCountLabel')}
              type="number"
              required
              value={newDays}
              onChange={e => setNewDays(Number(e.target.value))}
            />
            <Input
              label={t('leave.detailedReasonLabel')}
              required
              value={newReason}
              onChange={e => setNewReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsNewRequestOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button variant="primary" size="sm" type="submit">
                {t('leave.submitForApprovalBtn')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
