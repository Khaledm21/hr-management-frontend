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
  const { t } = useTranslation();
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
    success(`Leave request for ${approvingRequest.employeeName} approved.`, 'Leave Approved');
    setApprovingRequest(null);
    setApprovalComment('');
    await fetchLeaveData();
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest || !rejectReason.trim()) return;
    await leaveService.rejectLeave(rejectingRequest.id, rejectReason);
    toastError(`Leave rejected: ${rejectReason}`, 'Leave Request Rejected');
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
    success('Leave request submitted to department workflow.', 'Request Lodged');
    setIsNewRequestOpen(false);
    await fetchLeaveData();
  };

  const requestColumns: Column<LeaveRequest>[] = useMemo(
    () => [
      {
        key: 'employeeName',
        header: 'Employee',
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.employeeName}</span>
            <span className="text-[11px] font-mono text-slate-400">{row.employeeCode}</span>
          </div>
        ),
      },
      {
        key: 'department',
        header: 'Department',
        sortable: true,
        render: row => <span className="text-slate-600 font-medium">{row.department}</span>,
      },
      {
        key: 'leaveType',
        header: t('leave.leaveType'),
        sortable: true,
        render: row => (
          <span className="uppercase text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {row.leaveType}
          </span>
        ),
      },
      {
        key: 'dates',
        header: 'Leave Duration',
        sortable: true,
        accessor: row => row.startDate,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.startDate} to {row.endDate}</span>
            <span className="text-[11px] text-brand-600 font-medium">{row.days} calendar days</span>
          </div>
        ),
      },
      {
        key: 'reason',
        header: 'Stated Purpose',
        render: row => <span className="text-slate-600 text-xs line-clamp-1">{row.reason}</span>,
      },
      {
        key: 'status',
        header: 'Workflow Status',
        sortable: true,
        render: row => {
          if (row.status === 'approved') return <Badge variant="success">Approved</Badge>;
          if (row.status === 'pending') return <Badge variant="warning">Awaiting Approval</Badge>;
          if (row.status === 'rejected') return <Badge variant="danger">Rejected</Badge>;
          return <Badge variant="secondary">Cancelled</Badge>;
        },
      },
      {
        key: 'approverName',
        header: t('leave.approver'),
        render: row => <span className="text-slate-500 text-xs">{row.approverName || '-'}</span>,
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
                  onClick={() => setApprovingRequest(row)}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Approve"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRejectingRequest(row)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
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

  const balanceColumns: Column<LeaveBalance>[] = useMemo(
    () => [
      {
        key: 'employeeName',
        header: 'Employee',
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.employeeName}</span>
            <span className="text-[11px] font-mono text-slate-400">{row.employeeCode}</span>
          </div>
        ),
      },
      {
        key: 'department',
        header: 'Department',
        sortable: true,
        render: row => <span className="text-slate-600 font-medium">{row.department}</span>,
      },
      {
        key: 'annualTotal',
        header: 'Annual Allotted',
        sortable: true,
        render: row => <span className="font-semibold text-slate-800">{row.annualTotal} Days</span>,
      },
      {
        key: 'annualUsed',
        header: 'Annual Used',
        sortable: true,
        render: row => <span className="text-amber-700 font-medium">{row.annualUsed} Days</span>,
      },
      {
        key: 'annualRemaining',
        header: 'Annual Balance',
        sortable: true,
        render: row => (
          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            {row.annualRemaining} Days
          </span>
        ),
      },
      {
        key: 'sickUsed',
        header: 'Sick Days Used',
        sortable: true,
        render: row => <span className="text-slate-600">{row.sickUsed} / {row.sickTotal}</span>,
      },
      {
        key: 'emergencyUsed',
        header: 'Casual Days Used',
        sortable: true,
        render: row => <span className="text-slate-600">{row.emergencyUsed} / {row.emergencyTotal}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('leave.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('leave.subtitle')}</p>
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
          searchPlaceholder="Search employee or leave reason..."
          exportFilename="Apex_Enterprise_Leave_Requests"
          filtersSlot={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="all">All Departments</option>
                {mockDepartments.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
          searchPlaceholder="Search employee code or name..."
          exportFilename="Apex_Enterprise_Leave_Balances_Accruals"
        />
      )}

      {/* Approve Modal */}
      {approvingRequest && (
        <Modal
          isOpen={!!approvingRequest}
          onClose={() => setApprovingRequest(null)}
          size="md"
          title="Approve Leave Application"
          description={`Sign-off on ${approvingRequest.days} days ${approvingRequest.leaveType} leave for ${approvingRequest.employeeName}`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setApprovingRequest(null)}>
                Cancel
              </Button>
              <Button variant="success" size="sm" onClick={handleConfirmApprove}>
                Sign & Approve
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-800">
                Period: {approvingRequest.startDate} to {approvingRequest.endDate}
              </p>
              <p className="text-slate-500 mt-1">Stated Reason: {approvingRequest.reason}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approval Remarks (Optional)
              </label>
              <input
                type="text"
                value={approvalComment}
                onChange={e => setApprovalComment(e.target.value)}
                placeholder="e.g. Workload covered by senior engineer."
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
          title="Reject Leave Application"
          description={`Reject leave request for ${rejectingRequest.employeeName}`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setRejectingRequest(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="block text-xs font-semibold text-slate-700">
              Mandatory Rejection Justification *
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Clashes with critical release deliverables or insufficient leave balance..."
              className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
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
          title="Submit Leave Application"
          description="Lodge a statutory leave request into the automated approval chain"
        >
          <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
            <Input
              label="Employee Name"
              required
              value={newEmployeeName}
              onChange={e => setNewEmployeeName(e.target.value)}
            />
            <Select
              label="Leave Classification"
              required
              value={newType}
              onChange={e => setNewType(e.target.value as LeaveType)}
              options={[
                { value: 'annual', label: 'Annual Paid Leave' },
                { value: 'sick', label: 'Sick / Medical Leave' },
                { value: 'emergency', label: 'Casual / Emergency Leave' },
                { value: 'unpaid', label: 'Unpaid Leave' },
                { value: 'maternity', label: 'Maternity / Parental Leave' },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                required
                value={newStartDate}
                onChange={e => setNewStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                required
                value={newEndDate}
                onChange={e => setNewEndDate(e.target.value)}
              />
            </div>
            <Input
              label="Calendar Days Count"
              type="number"
              required
              value={newDays}
              onChange={e => setNewDays(Number(e.target.value))}
            />
            <Input
              label="Detailed Reason"
              required
              value={newReason}
              onChange={e => setNewReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsNewRequestOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Submit for Approval
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
