import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Clock,
  History,
  FileText,
  User,
  ArrowRight,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { approvalService } from '../../services/approvalService';
import { ApprovalItem, ApprovalCategory, ApprovalStatus } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';

export const ApprovalsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals / Drawers
  const [activeItem, setActiveItem] = useState<ApprovalItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [changesItem, setChangesItem] = useState<ApprovalItem | null>(null);
  const [changeNotes, setChangeNotes] = useState('');

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const data = await approvalService.getApprovals({
        category: selectedCategory as any,
        status: selectedStatus as any,
      });
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [selectedCategory, selectedStatus]);

  const handleApprove = async (item: ApprovalItem) => {
    await approvalService.approveItem(item.id, user?.name || 'Authorized Signatory');
    success(`Workflow approved for ${item.approvalCode}.`, 'Approved');
    await fetchApprovals();
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem || !rejectReason.trim()) return;
    await approvalService.rejectItem(rejectingItem.id, rejectReason, user?.name || 'Signatory');
    toastError(`Workflow rejected: ${rejectReason}`, 'Request Rejected');
    setRejectingItem(null);
    setRejectReason('');
    await fetchApprovals();
  };

  const handleConfirmChanges = async () => {
    if (!changesItem || !changeNotes.trim()) return;
    await approvalService.requestChanges(changesItem.id, changeNotes, user?.name || 'Signatory');
    success(`Requested amendments for ${changesItem.approvalCode}.`, 'Changes Requested');
    setChangesItem(null);
    setChangeNotes('');
    await fetchApprovals();
  };

  const getCategoryBadge = (category: ApprovalCategory) => {
    const map: Record<ApprovalCategory, { label: string; variant: any }> = {
      leave: { label: 'Leave Request', variant: 'info' },
      salary_change: { label: 'Compensation / Promotion', variant: 'warning' },
      advance: { label: 'Salary Advance', variant: 'default' },
      contract_renewal: { label: 'Contract Renewal', variant: 'success' },
      employee_change: { label: 'Employee Data Change', variant: 'secondary' },
      other: { label: 'General HR Request', variant: 'outline' },
    };
    const c = map[category] || { label: category, variant: 'default' };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    if (status === 'approved') return <Badge variant="success">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="danger">Rejected</Badge>;
    if (status === 'changes_requested') return <Badge variant="warning">Changes Requested</Badge>;
    return <Badge variant="warning">Pending Sign-off</Badge>;
  };

  const columns: Column<ApprovalItem>[] = useMemo(
    () => [
      {
        key: 'approvalCode',
        header: 'Req #',
        sortable: true,
        width: '130px',
        render: row => (
          <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
            {row.approvalCode}
          </span>
        ),
      },
      {
        key: 'title',
        header: 'Request Title & Summary',
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.title}</span>
            <span className="text-[11px] text-slate-500 line-clamp-1">{row.summary}</span>
          </div>
        ),
      },
      {
        key: 'category',
        header: t('approvals.category'),
        sortable: true,
        render: row => getCategoryBadge(row.category),
      },
      {
        key: 'employeeName',
        header: 'Target Employee',
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-800 block">{row.employeeName}</span>
            <span className="text-[11px] text-slate-400">{row.department}</span>
          </div>
        ),
      },
      {
        key: 'currentStep',
        header: t('approvals.currentStep'),
        render: row => (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-700">{row.currentStep}</span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: row => getStatusBadge(row.status),
      },
      {
        key: 'submittedAt',
        header: t('approvals.submittedAt'),
        sortable: true,
        render: row => <span className="text-slate-400 text-xs">{row.submittedAt}</span>,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => setActiveItem(row)}
            >
              Details
            </Button>

            {row.status === 'pending' && (
              <>
                <button
                  onClick={() => handleApprove(row)}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Approve"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setChangesItem(row);
                    setChangeNotes('');
                  }}
                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                  title="Request Changes"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setRejectingItem(row);
                    setRejectReason('');
                  }}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('approvals.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('approvals.subtitle')}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search request code, title, or employee..."
        exportFilename="Apex_Enterprise_Approvals_Inbox"
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Request Categories</option>
              <option value="leave">Leave Requests</option>
              <option value="salary_change">Salary & Promotions</option>
              <option value="advance">Salary Advances</option>
              <option value="contract_renewal">Contract Renewals</option>
              <option value="employee_change">Personnel Profile Changes</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        }
      />

      {/* Details Drawer with Multi-step History Timeline */}
      {activeItem && (
        <Drawer
          isOpen={!!activeItem}
          onClose={() => setActiveItem(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="font-mono">{activeItem.approvalCode}</span>
              {getStatusBadge(activeItem.status)}
            </div>
          }
          subtitle={`Initiated by ${activeItem.requesterName} • ${activeItem.submittedAt}`}
          width="lg"
          footer={
            activeItem.status === 'pending' ? (
              <div className="flex items-center justify-end gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChangesItem(activeItem);
                    setActiveItem(null);
                  }}
                >
                  Request Changes
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setRejectingItem(activeItem);
                    setActiveItem(null);
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    handleApprove(activeItem);
                    setActiveItem(null);
                  }}
                >
                  Sign & Approve
                </Button>
              </div>
            ) : undefined
          }
        >
          <div className="space-y-6 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">{activeItem.title}</h4>
              <p className="text-slate-600 leading-relaxed">{activeItem.summary}</p>
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div>
                  <span className="block text-slate-400">Employee:</span>
                  <span className="font-semibold text-slate-800">{activeItem.employeeName}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-800">{activeItem.department}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-brand-600" />
                Approval Chain Progression
              </h4>

              <div className="relative pl-6 rtl:pl-0 rtl:pr-6 border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-200 space-y-5">
                {activeItem.history.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-0.5 w-4 h-4 rounded-full ring-4 ring-white ${
                        step.action === 'Approved'
                          ? 'bg-emerald-600'
                          : step.action === 'Rejected'
                          ? 'bg-rose-600'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{step.step}</span>
                        <span className="text-[10px] text-slate-400">{step.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Actor: <span className="font-semibold">{step.actor}</span> • Status: <span className="font-medium">{step.action}</span>
                      </div>
                      {step.comment && (
                        <p className="mt-1.5 p-2 rounded bg-slate-50 border border-slate-100 text-slate-600 italic">
                          "{step.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Reject Modal with Required Reason */}
      {rejectingItem && (
        <Modal
          isOpen={!!rejectingItem}
          onClose={() => setRejectingItem(null)}
          size="md"
          title="Reject Request"
          description={`Rejecting ${rejectingItem.approvalCode} (${rejectingItem.title})`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setRejectingItem(null)}>
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
              Mandatory Rejection Reason *
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="State clear reason why this request cannot be approved..."
              className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </Modal>
      )}

      {/* Request Changes Modal */}
      {changesItem && (
        <Modal
          isOpen={!!changesItem}
          onClose={() => setChangesItem(null)}
          size="md"
          title="Request Revisions / Changes"
          description={`Request amendments for ${changesItem.approvalCode}`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setChangesItem(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!changeNotes.trim()}
                onClick={handleConfirmChanges}
              >
                Send Revision Request
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="block text-xs font-semibold text-slate-700">
              Revision Instructions *
            </label>
            <textarea
              rows={3}
              required
              value={changeNotes}
              onChange={e => setChangeNotes(e.target.value)}
              placeholder="Specify what details, attachments, or values the requester should adjust..."
              className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
