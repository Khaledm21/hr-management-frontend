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
  Filter,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { Card, CardContent } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Textarea';
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

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter(i => i.status === 'pending').length;
    const approved = items.filter(i => i.status === 'approved').length;
    const rejected = items.filter(i => i.status === 'rejected' || i.status === 'changes_requested').length;
    return { total, pending, approved, rejected };
  }, [items]);

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
    const map: Record<ApprovalCategory, { label: string; variant: 'info' | 'warning' | 'default' | 'success' | 'secondary' }> = {
      leave: { label: t('approvals.catLeave', 'Leave Request'), variant: 'info' },
      salary_change: { label: t('approvals.catSalary', 'Compensation / Promotion'), variant: 'warning' },
      advance: { label: t('approvals.catAdvance', 'Salary Advance'), variant: 'default' },
      contract_renewal: { label: t('approvals.catRenewal', 'Contract Renewal'), variant: 'success' },
      employee_change: { label: t('approvals.catProfile', 'Employee Data Change'), variant: 'secondary' },
      other: { label: t('approvals.catOther', 'General HR Request'), variant: 'default' },
    };
    const c = map[category] || { label: category, variant: 'default' };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    if (status === 'approved') return <Badge variant="success">{t('approvals.statusApproved', 'Approved')}</Badge>;
    if (status === 'rejected') return <Badge variant="danger">{t('approvals.statusRejected', 'Rejected')}</Badge>;
    if (status === 'changes_requested') return <Badge variant="warning">{t('approvals.statusChanges', 'Changes Requested')}</Badge>;
    return <Badge variant="warning">{t('approvals.statusPending', 'Pending Sign-off')}</Badge>;
  };

  const columns: Column<ApprovalItem>[] = useMemo(
    () => [
      {
        key: 'approvalCode',
        header: t('approvals.reqNumber', 'Req #'),
        sortable: true,
        width: '130px',
        render: row => (
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] px-2 py-0.5 rounded text-xs">
            {row.approvalCode}
          </span>
        ),
      },
      {
        key: 'title',
        header: t('approvals.requestTitle', 'Request Title & Summary'),
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block">{row.title}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{row.summary}</span>
          </div>
        ),
      },
      {
        key: 'category',
        header: t('approvals.category', 'Category'),
        sortable: true,
        render: row => getCategoryBadge(row.category),
      },
      {
        key: 'employeeName',
        header: t('approvals.targetEmployee', 'Target Employee'),
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">{row.employeeName}</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{row.department}</span>
          </div>
        ),
      },
      {
        key: 'currentStep',
        header: t('approvals.currentStep', 'Approval Stage'),
        render: row => (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{row.currentStep}</span>
          </div>
        ),
      },
      {
        key: 'status',
        header: t('approvals.status', 'Status'),
        sortable: true,
        render: row => getStatusBadge(row.status),
      },
      {
        key: 'submittedAt',
        header: t('approvals.submittedAt', 'Submitted Date'),
        sortable: true,
        render: row => <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">{row.submittedAt}</span>,
      },
      {
        key: 'actions',
        header: t('approvals.actions', 'Actions'),
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => setActiveItem(row)}
            >
              {t('common.details', 'Details')}
            </Button>

            {row.status === 'pending' && (
              <>
                <button
                  onClick={() => handleApprove(row)}
                  className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  title="Approve"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setChangesItem(row);
                    setChangeNotes('');
                  }}
                  className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                  title="Request Changes"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setRejectingItem(row);
                    setRejectReason('');
                  }}
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>{t('approvals.title', 'إدارة ومتابعة طلبات الاعتماد (Approvals)')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('approvals.subtitle', 'سجل دورات الاعتماد والموافقات الإدارية المتراتبة لطلبات الموظفين')}
          </p>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('approvals.allRequests', 'Total Requests')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">{stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('approvals.pendingReview', 'Pending Review')}</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('approvals.approvedRequests', 'Approved')}</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.approved}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('approvals.rejectedOrRevision', 'Rejected / Revisions')}</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.rejected}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder={t('approvals.searchPlaceholder', 'بحث بكود الطلب، العنوان، أو اسم الموظف...')}
        exportFilename="Apex_Enterprise_Approvals_Inbox"
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-xs [&>option]:bg-white [&>option]:dark:bg-[#151D2E]"
            >
              <option value="all">{t('approvals.allCategories', 'All Request Categories')}</option>
              <option value="leave">{t('approvals.catLeave', 'Leave Requests')}</option>
              <option value="salary_change">{t('approvals.catSalary', 'Salary & Promotions')}</option>
              <option value="advance">{t('approvals.catAdvance', 'Salary Advances')}</option>
              <option value="contract_renewal">{t('approvals.catRenewal', 'Contract Renewals')}</option>
              <option value="employee_change">{t('approvals.catProfile', 'Personnel Profile Changes')}</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-xs [&>option]:bg-white [&>option]:dark:bg-[#151D2E]"
            >
              <option value="all">{t('approvals.allStatuses', 'All Statuses')}</option>
              <option value="pending">{t('approvals.statusPending', 'Pending Review')}</option>
              <option value="approved">{t('approvals.statusApproved', 'Approved')}</option>
              <option value="changes_requested">{t('approvals.statusChanges', 'Changes Requested')}</option>
              <option value="rejected">{t('approvals.statusRejected', 'Rejected')}</option>
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
              <span className="font-mono text-slate-900 dark:text-[#F8FAFC]">{activeItem.approvalCode}</span>
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
            <div className="bg-slate-50 dark:bg-[#0B0F19] p-4 rounded-xl border border-slate-200 dark:border-[#1E293B] space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">{activeItem.title}</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{activeItem.summary}</p>
              <div className="pt-2 border-t border-slate-200 dark:border-[#1E293B] grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div>
                  <span className="block text-slate-400 dark:text-slate-500">Employee:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeItem.employeeName}</span>
                </div>
                <div>
                  <span className="block text-slate-400 dark:text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeItem.department}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Approval Chain Progression</span>
              </h4>

              <div className="relative pl-6 rtl:pl-0 rtl:pr-6 border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-200 dark:border-[#1E293B] space-y-5">
                {activeItem.history.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-0.5 w-4 h-4 rounded-full ring-4 ring-white dark:ring-[#151D2E] ${
                        step.action === 'Approved'
                          ? 'bg-emerald-600'
                          : step.action === 'Rejected'
                          ? 'bg-rose-600'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{step.step}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{step.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        Actor: <span className="font-semibold">{step.actor}</span> • Status: <span className="font-medium">{step.action}</span>
                      </div>
                      {step.comment && (
                        <p className="mt-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F19] border border-slate-100 dark:border-[#1E293B] text-slate-600 dark:text-slate-300 italic">
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
            <Textarea
              label="Mandatory Rejection Reason"
              rows={3}
              required
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="State clear reason why this request cannot be approved..."
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
            <Textarea
              label="Revision Instructions"
              rows={3}
              required
              value={changeNotes}
              onChange={e => setChangeNotes(e.target.value)}
              placeholder="Specify what details, attachments, or values the requester should adjust..."
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
export default ApprovalsPage;
