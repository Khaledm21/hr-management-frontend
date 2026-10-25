import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Trash2,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmployeeSearchSelect } from '../../components/ui/EmployeeSearchSelect';
import { DocumentRecord, DocumentType, DocumentStatus } from '../../types';
import {
  useEmployees,
  useDocuments,
  useVerifyDocumentMutation,
  useRejectDocumentMutation,
  useDeleteDocumentMutation,
  useBulkDeleteDocumentsMutation,
  useDeleteAllDocumentsMutation,
  useUploadDocumentMutation,
} from '../../hooks/queries';
import { useToast } from '../../components/ui/Toast';
import { cn, downloadCSV } from '../../lib/utils';

export const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  // Filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const filterParams = useMemo(() => ({
    type: selectedType !== 'all' ? (selectedType as any) : undefined,
    status: selectedStatus !== 'all' ? (selectedStatus as any) : undefined,
    department: selectedDept !== 'all' ? selectedDept : undefined,
  }), [selectedType, selectedStatus, selectedDept]);

  // React Query cached documents
  const { data: documents = [], isLoading } = useDocuments(filterParams);

  // Mutations
  const verifyMutation = useVerifyDocumentMutation();
  const rejectMutation = useRejectDocumentMutation();
  const deleteMutation = useDeleteDocumentMutation();
  const bulkDeleteMutation = useBulkDeleteDocumentsMutation();
  const deleteAllMutation = useDeleteAllDocumentsMutation();
  const uploadMutation = useUploadDocumentMutation();

  // Live employees for upload association
  const { data: employeesRes } = useEmployees({ pageSize: 300 });
  const employeesList = useMemo(() => employeesRes?.data ?? [], [employeesRes]);
  const employeeOptions = useMemo(() => {
    return employeesList.map(e => ({
      value: e.id,
      label: `${e.arabicName || `${e.firstName} ${e.lastName}`} (${e.employeeId})`,
      department: e.departmentName,
      name: e.arabicName || `${e.firstName} ${e.lastName}`,
    }));
  }, [employeesList]);

  // Selection & Deletion State
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<DocumentRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Form state
  const [selectedUploadEmployeeId, setSelectedUploadEmployeeId] = useState<string>('');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadEmployeeName, setUploadEmployeeName] = useState('Mohammed Al-Ghamdi');
  const [uploadDept, setUploadDept] = useState('Engineering & Technology');
  const [uploadType, setUploadType] = useState<DocumentType>('national_id');
  const [uploadFileName, setUploadFileName] = useState('National_ID_Scan_2026.pdf');

  // Selection Helpers
  const isAllDocsSelected = documents.length > 0 && documents.every(d => selectedDocIds.includes(d.id));
  const isSomeDocsSelected = documents.some(d => selectedDocIds.includes(d.id)) && !isAllDocsSelected;

  const handleToggleSelectAllDocs = () => {
    if (isAllDocsSelected) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(documents.map(d => d.id));
    }
  };

  const handleExportSelectedDocs = () => {
    const selectedRows = documents.filter(d => selectedDocIds.includes(d.id));
    if (selectedRows.length > 0) {
      downloadCSV('Selected_Enterprise_Documents', selectedRows);
      success(t('documents.exportSuccess', { count: selectedRows.length }));
    }
  };

  const handleConfirmDeleteAllDocs = async () => {
    setIsDeleting(true);
    try {
      const count = await deleteAllMutation.mutateAsync();
      success(t('documents.deleteAllSuccess', { count }));
      setSelectedDocIds([]);
      setIsDeleteAllModalOpen(false);
    } catch (err: any) {
      toastError(err?.message || t('documents.deleteAllError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDeleteDocs = async () => {
    setIsDeleting(true);
    try {
      const count = await bulkDeleteMutation.mutateAsync(selectedDocIds);
      success(t('documents.bulkDeleteSuccess', { count }));
      setSelectedDocIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err: any) {
      toastError(err?.message || t('documents.bulkDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSingleDeleteDoc = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(deletingDoc.id);
      success(t('documents.singleDeleteSuccess', { title: deletingDoc.title }));
      setSelectedDocIds(prev => prev.filter(id => id !== deletingDoc.id));
      setDeletingDoc(null);
    } catch (err: any) {
      toastError(err?.message || t('documents.singleDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVerify = async (doc: DocumentRecord) => {
    try {
      await verifyMutation.mutateAsync({ id: doc.id });
      success(t('documents.verifySuccess', { title: doc.title }), t('documents.verifyRecorded'));
    } catch (err: any) {
      toastError(err?.message || t('documents.verifyError'));
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingDoc || !rejectionReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: rejectingDoc.id, rejectionReason });
      toastError(t('documents.rejectSuccess', { reason: rejectionReason }), t('documents.rejectRecorded'));
      setRejectingDoc(null);
      setRejectionReason('');
    } catch (err: any) {
      toastError(err?.message || t('documents.rejectError'));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadEmployeeId && employeesList.length > 0) {
      toastError('يرجى اختيار الموظف صاحب المستند بالبحث عنه أولاً', 'تنبيه');
      return;
    }
    const chosenEmp = employeesList.find(item => item.id === selectedUploadEmployeeId);
    try {
      await uploadMutation.mutateAsync({
        file: selectedUploadFile || undefined,
        employeeId: selectedUploadEmployeeId || (employeesList[0]?.id ?? 'emp-1'),
        employeeName: chosenEmp ? (chosenEmp.arabicName || `${chosenEmp.firstName} ${chosenEmp.lastName}`) : uploadEmployeeName,
        department: chosenEmp ? chosenEmp.departmentName : uploadDept,
        type: uploadType,
        title: uploadTitle || (selectedUploadFile ? selectedUploadFile.name.replace(/\.[^/.]+$/, '') : uploadFileName),
      });
      success(t('documents.uploadSuccess'), t('documents.uploadSuccessTitle'));
      setIsUploadOpen(false);
      setSelectedUploadFile(null);
      setUploadTitle('');
      setSelectedUploadEmployeeId('');
    } catch (err: any) {
      toastError(err?.message || t('documents.uploadError'));
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const map: Record<DocumentStatus, { label: string; variant: BadgeVariant }> = {
      verified: { label: t('documents.statusVerified', 'Verified'), variant: 'success' },
      under_review: { label: t('documents.statusUnderReview', 'Under Review'), variant: 'warning' },
      uploaded: { label: t('documents.statusUploaded', 'Uploaded'), variant: 'info' },
      missing: { label: t('documents.statusMissing', 'Missing'), variant: 'danger' },
      rejected: { label: t('documents.statusRejected', 'Rejected'), variant: 'danger' },
      expired: { label: t('documents.statusExpired', 'Expired'), variant: 'secondary' },
    };
    const s = map[status] || { label: status, variant: 'default' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const columns: Column<DocumentRecord>[] = useMemo(
    () => [
      {
        key: 'employeeName',
        header: t('documents.colEmployeeName', 'Employee Name'),
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.employeeName}</span>
            <span className="text-[11px] text-slate-400">{row.department}</span>
          </div>
        ),
      },
      {
        key: 'title',
        header: t('documents.colDocTitle', 'Document Name & Type'),
        sortable: true,
        render: row => (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-800 block">{row.title}</span>
              <span className="text-[11px] font-mono text-slate-400">{row.fileName} • {row.fileSize}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: t('documents.colStatus', 'Verification Status'),
        sortable: true,
        render: row => getStatusBadge(row.status),
      },
      {
        key: 'uploadedAt',
        header: t('documents.colUploadedAt', 'Uploaded Date'),
        sortable: true,
        render: row => (
          <div>
            <span className="text-slate-600 text-xs block">{row.uploadedAt || '-'}</span>
            {(row.verificationDate || row.verifiedAt) && (
              <span className="text-[10px] text-emerald-600 block font-medium">
                {t('documents.verifiedPrefix')} {row.verificationDate || row.verifiedAt}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'notes',
        header: t('documents.colNotes'),
        render: row => (
          <span className="text-slate-500 text-[11px] line-clamp-1 max-w-xs">
            {row.rejectionReason ? `${t('documents.reasonPrefix')} ${row.rejectionReason}` : row.notes || '-'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setPreviewDoc(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
              title={t('documents.previewTooltip')}
            >
              <Eye className="w-4 h-4" />
            </button>

            {row.status !== 'verified' && row.status !== 'missing' && (
              <>
                <button
                  onClick={() => handleVerify(row)}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title={t('documents.verifyTooltip')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setRejectingDoc(row);
                    setRejectionReason('');
                  }}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  title={t('documents.rejectTooltip')}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={() => setDeletingDoc(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title={t('documents.deleteSingle')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
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
            {t('documents.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('documents.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {documents.length > 0 && (
            <Button
              variant="outline"
              size="md"
              leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              {t('documents.deleteAll')}
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => setIsUploadOpen(true)}
          >
            {t('documents.uploadDoc')}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={documents}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder={t('documents.searchDocsPlaceholder')}
        exportFilename="Apex_Enterprise_Compliance_Documents"
        selectable
        selectAllAcrossPages
        selectedIds={selectedDocIds}
        onSelectionChange={setSelectedDocIds}
        bulkActions={(ids, clear) => (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDocIds(documents.map(d => d.id))}
              disabled={ids.length === documents.length}
            >
              {t('documents.selectAll')} ({documents.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportSelectedDocs}
            >
              {t('documents.exportSelected')} ({ids.length})
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                if (ids.length === documents.length) {
                  setIsDeleteAllModalOpen(true);
                } else {
                  setIsBulkDeleteModalOpen(true);
                }
              }}
            >
              {ids.length === documents.length
                ? t('documents.deleteAll')
                : t('documents.deleteSelected', { count: ids.length })}
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              {t('documents.clearSelection')}
            </Button>
          </div>
        )}
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2">
            <label
              title={isAllDocsSelected ? t('documents.clearSelection') : t('documents.selectAll')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all shadow-sm select-none',
                isAllDocsSelected
                  ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-400 dark:border-brand-800/40 text-brand-800 dark:text-[#38BDF8] ring-1 ring-brand-300'
                  : isSomeDocsSelected
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/40 text-amber-900 dark:text-amber-300'
                  : 'bg-white dark:bg-[#0B0F19] border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E293B] hover:border-slate-400'
              )}
            >
              <input
                type="checkbox"
                checked={isAllDocsSelected}
                ref={el => {
                  if (el) el.indeterminate = isSomeDocsSelected && !isAllDocsSelected;
                }}
                onChange={handleToggleSelectAllDocs}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-[#1E293B] cursor-pointer accent-brand-600"
              />
              <span className="whitespace-nowrap">
                {isAllDocsSelected
                  ? t('documents.allSelectedCount', { count: documents.length })
                  : isSomeDocsSelected
                  ? t('documents.selectedCountOf', { selected: selectedDocIds.length, total: documents.length })
                  : t('documents.selectAllCount', { count: documents.length })}
              </span>
            </label>

            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">{t('documents.allTypes')}</option>
              <option value="national_id">{t('documents.typeNationalId')}</option>
              <option value="qualification">{t('documents.typeQualification')}</option>
              <option value="contract">{t('documents.typeContract')}</option>
              <option value="insurance">{t('documents.typeInsurance')}</option>
              <option value="birth_certificate">{t('documents.typeBirthCert')}</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">{t('documents.allStatuses')}</option>
              <option value="verified">{t('documents.statusVerified')}</option>
              <option value="under_review">{t('documents.statusUnderReview')}</option>
              <option value="missing">{t('documents.statusMissing')}</option>
              <option value="rejected">{t('documents.statusRejected')}</option>
              <option value="expired">{t('documents.statusExpired')}</option>
            </select>
          </div>
        }
      />

      {/* Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          size="lg"
          title={t('documents.previewModalTitleWithDoc', { title: previewDoc.title })}
          description={t('documents.previewEmployeeDesc', { name: previewDoc.employeeName, department: previewDoc.department })}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('documents.fileId', { id: previewDoc.id })}</span>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => {
                  success(t('documents.downloading', { fileName: previewDoc.fileName }));
                  setPreviewDoc(null);
                }}
              >
                {t('documents.downloadPDF')}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-100 dark:bg-[#0B0F19] rounded-xl p-8 border border-slate-200 dark:border-[#1E293B] flex flex-col items-center justify-center text-center">
              <FileText className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-3" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">{previewDoc.fileName}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('documents.simulatedDoc', { fileSize: previewDoc.fileSize })}
              </p>
              <div className="mt-4 flex gap-2">
                {getStatusBadge(previewDoc.status)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-[#1E293B] p-4 bg-slate-50/60 dark:bg-[#111827]/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('documents.verificationStamp')}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{previewDoc.verifiedBy || t('documents.pendingVerification')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('documents.expiryHorizon')}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{previewDoc.expiryDate || t('documents.noExpirySet')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('documents.complianceNotes')}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{previewDoc.notes || t('documents.noAnnotations')}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Modal with Required Reason */}
      {rejectingDoc && (
        <Modal
          isOpen={!!rejectingDoc}
          onClose={() => setRejectingDoc(null)}
          size="md"
          title={t('documents.rejectModalTitle')}
          description={t('documents.rejectModalDesc', { title: rejectingDoc.title, employeeName: rejectingDoc.employeeName })}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setRejectingDoc(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!rejectionReason.trim()}
                onClick={handleConfirmReject}
              >
                {t('documents.rejectConfirmBtn')}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t('documents.mandatoryRejectReason')}
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder={t('documents.rejectPlaceholder')}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] p-3 text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
        </Modal>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          size="md"
          title={t('documents.uploadModalTitle')}
          description={t('documents.uploadModalDesc')}
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            {employeesList.length > 0 ? (
              <EmployeeSearchSelect
                label={t('documents.docOwnerEmployee', 'الموظف صاحب المستند')}
                required
                employees={employeesList}
                selectedEmployeeId={selectedUploadEmployeeId}
                onSelectEmployee={emp => {
                  if (emp) {
                    setSelectedUploadEmployeeId(emp.id);
                    setUploadEmployeeName(emp.arabicName || `${emp.firstName} ${emp.lastName}`);
                    setUploadDept(emp.departmentName);
                  } else {
                    setSelectedUploadEmployeeId('');
                  }
                }}
                placeholder="ابحث باسم الموظف، الرقم القومي، الرقم الوظيفي، أو القسم..."
              />
            ) : (
              <Input
                label={t('documents.employeeNameLabel')}
                required
                value={uploadEmployeeName}
                onChange={e => setUploadEmployeeName(e.target.value)}
              />
            )}

            <div className="space-y-1">
              <Select
                label={t('documents.docCategoryLabel', 'نوع المستند / مسوغ التعيين')}
                required
                value={uploadType}
                onChange={e => setUploadType(e.target.value as DocumentType)}
                options={[
                  { value: 'qualification', label: '🎓 أصل المؤهل الدراسي' },
                  { value: 'birth_certificate', label: '📄 شهادة الميلاد (كمبيوتر)' },
                  { value: 'national_id', label: '🪪 صورة بطاقة الرقم القومي (سارية)' },
                  { value: 'contract', label: '📑 عقد العمل المعتمد' },
                  { value: 'insurance', label: '🛡️ استمارة 1 / برنت تأميني' },
                  { value: 'military_service', label: '🪖 شهادة الموقف من التجنيد' },
                  { value: 'labor_permit', label: '💼 كعب العمل (مكتب التشغيل)' },
                  { value: 'criminal_record', label: '⚖️ صحيفة الحالة الجنائية (فيش جنائي)' },
                  { value: 'medical', label: '🏥 الشهادة الصحية / الفحص الطبي' },
                  { value: 'other', label: '📂 مستند رسمي آخر' },
                ]}
              />
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>المستند المرفوع سيحدّث تلقائياً شيت مسوغات التعيين والتأمينات ويتحول من ناقص إلى كامل.</span>
              </p>
            </div>

            <Input
              label={t('documents.docTitleLabel')}
              required
              placeholder={t('documents.docTitlePlaceholder')}
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
            />

            <div className="border-2 border-dashed border-slate-300 dark:border-[#1E293B] rounded-xl p-5 text-center bg-slate-50 dark:bg-[#0B0F19] hover:bg-slate-100 dark:hover:bg-[#1E293B]/40 transition-colors">
              <input
                type="file"
                id="doc-file-input"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setSelectedUploadFile(f);
                    if (!uploadTitle) {
                      setUploadTitle(f.name.replace(/\.[^/.]+$/, ''));
                    }
                  }
                }}
              />
              <label htmlFor="doc-file-input" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-brand-600 dark:text-[#38BDF8] mx-auto mb-2" />
                {selectedUploadFile ? (
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">{selectedUploadFile.name}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                      {t('documents.fileSelected', { size: (selectedUploadFile.size / (1024 * 1024)).toFixed(2) })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('documents.clickToChooseFile')}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{t('documents.supportedFileFormats')}</p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsUploadOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" size="sm" type="submit">
                {t('documents.uploadAndSave')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete All Documents Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleConfirmDeleteAllDocs}
        title={t('documents.confirmDeleteAllTitle')}
        message={t('documents.confirmDeleteAllMessage', { count: documents.length })}
        confirmLabel={t('documents.confirmDeleteAllButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Bulk Delete Documents Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDeleteDocs}
        title={t('documents.confirmBulkDeleteTitle')}
        message={t('documents.confirmBulkDeleteMessage', { count: selectedDocIds.length })}
        confirmLabel={t('documents.confirmBulkDeleteButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Single Delete Document Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleConfirmSingleDeleteDoc}
        title={t('documents.confirmSingleDeleteTitle')}
        message={t('documents.confirmSingleDeleteMessage', { name: deletingDoc?.title || deletingDoc?.fileName || '' })}
        confirmLabel={t('documents.confirmSingleDeleteButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />
    </div>
  );
};
