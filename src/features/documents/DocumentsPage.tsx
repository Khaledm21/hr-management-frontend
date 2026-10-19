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
  const employeeOptions = useMemo(() => {
    const list = employeesRes?.data ?? [];
    return list.map(e => ({
      value: e.id,
      label: `${e.arabicName || `${e.firstName} ${e.lastName}`} (${e.employeeId})`,
      department: e.departmentName,
      name: e.arabicName || `${e.firstName} ${e.lastName}`,
    }));
  }, [employeesRes]);

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
      success(`تم تصدير ${selectedRows.length} مستند بنجاح.`);
    }
  };

  const handleConfirmDeleteAllDocs = async () => {
    setIsDeleting(true);
    try {
      const count = await deleteAllMutation.mutateAsync();
      success(t('documents.deleteAllSuccess', { count }) || `تم حذف جميع المستندات (${count} مستند) بنجاح.`);
      setSelectedDocIds([]);
      setIsDeleteAllModalOpen(false);
    } catch (err: any) {
      toastError(err?.message || 'فشل حذف المستندات.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDeleteDocs = async () => {
    setIsDeleting(true);
    try {
      const count = await bulkDeleteMutation.mutateAsync(selectedDocIds);
      success(t('documents.bulkDeleteSuccess', { count }) || `تم حذف ${count} مستند محدد بنجاح.`);
      setSelectedDocIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err: any) {
      toastError(err?.message || 'فشل حذف المستندات المحددة.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSingleDeleteDoc = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(deletingDoc.id);
      success(`تم حذف المستند "${deletingDoc.title}" بنجاح.`);
      setSelectedDocIds(prev => prev.filter(id => id !== deletingDoc.id));
      setDeletingDoc(null);
    } catch (err: any) {
      toastError(err?.message || 'فشل حذف المستند.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVerify = async (doc: DocumentRecord) => {
    try {
      await verifyMutation.mutateAsync({ id: doc.id });
      success(`Document "${doc.title}" verified successfully.`, 'Verification Recorded');
    } catch (err: any) {
      toastError(err?.message || 'فشل توثيق المستند');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingDoc || !rejectionReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: rejectingDoc.id, rejectionReason });
      toastError(`Document marked as rejected: ${rejectionReason}`, 'Document Rejected');
      setRejectingDoc(null);
      setRejectionReason('');
    } catch (err: any) {
      toastError(err?.message || 'فشل رفض المستند');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenEmp = employeeOptions.find(item => item.value === selectedUploadEmployeeId);
    try {
      await uploadMutation.mutateAsync({
        file: selectedUploadFile || undefined,
        employeeId: selectedUploadEmployeeId || (employeeOptions[0]?.value ?? 'emp-1'),
        employeeName: chosenEmp?.name || uploadEmployeeName,
        department: chosenEmp?.department || uploadDept,
        type: uploadType,
        title: uploadTitle || (selectedUploadFile ? selectedUploadFile.name.replace(/\.[^/.]+$/, '') : uploadFileName),
      });
      success(`تم رفع وتوثيق المستند في النظام بنجاح.`, 'تم الرفع');
      setIsUploadOpen(false);
      setSelectedUploadFile(null);
      setUploadTitle('');
    } catch (err: any) {
      toastError(err?.message || 'فشل رفع المستند');
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
                موثق: {row.verificationDate || row.verifiedAt}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'notes',
        header: t('documents.colNotes', 'Verification Notes / Details'),
        render: row => (
          <span className="text-slate-500 text-[11px] line-clamp-1 max-w-xs">
            {row.rejectionReason ? `Reason: ${row.rejectionReason}` : row.notes || '-'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions', 'Actions'),
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setPreviewDoc(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
              title={t('documents.previewTooltip', 'Preview Document')}
            >
              <Eye className="w-4 h-4" />
            </button>

            {row.status !== 'verified' && row.status !== 'missing' && (
              <>
                <button
                  onClick={() => handleVerify(row)}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title={t('documents.verifyTooltip', 'Approve / Verify')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setRejectingDoc(row);
                    setRejectionReason('');
                  }}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  title={t('documents.rejectTooltip', 'Reject')}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={() => setDeletingDoc(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title={t('documents.deleteSingle', 'حذف المستند')}
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
              {t('documents.deleteAll', 'حذف جميع المستندات')}
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
        searchPlaceholder={t('documents.searchDocsPlaceholder', 'Search document name, filename, or employee...')}
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
              {t('documents.selectAll', 'تحديد الكل')} ({documents.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportSelectedDocs}
            >
              {t('documents.exportSelected', 'تصدير المحدد')} ({ids.length})
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
                ? t('documents.deleteAll', 'حذف جميع المستندات')
                : t('documents.deleteSelected', { count: ids.length }) || `حذف المحدد (${ids.length})`}
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              {t('documents.clearSelection', 'إلغاء التحديد')}
            </Button>
          </div>
        )}
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2">
            {/* خانة تحديد كل المستندات */}
            <label
              title={isAllDocsSelected ? t('documents.clearSelection', 'إلغاء التحديد') : t('documents.selectAll', 'تحديد الكل')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all shadow-sm select-none',
                isAllDocsSelected
                  ? 'bg-brand-50 border-brand-400 text-brand-800 ring-1 ring-brand-300'
                  : isSomeDocsSelected
                  ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              )}
            >
              <input
                type="checkbox"
                checked={isAllDocsSelected}
                ref={el => {
                  if (el) el.indeterminate = isSomeDocsSelected && !isAllDocsSelected;
                }}
                onChange={handleToggleSelectAllDocs}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer accent-brand-600"
              />
              <span className="whitespace-nowrap">
                {isAllDocsSelected
                  ? t('documents.allSelectedCount', { count: documents.length }) || `تم تحديد كل المستندات (${documents.length})`
                  : isSomeDocsSelected
                  ? t('documents.selectedCountOf', { selected: selectedDocIds.length, total: documents.length }) || `محدد (${selectedDocIds.length} من ${documents.length})`
                  : t('documents.selectAllCount', { count: documents.length }) || `تحديد كل المستندات (${documents.length})`}
              </span>
            </label>

            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">{t('documents.allTypes', 'All Document Types')}</option>
              <option value="national_id">{t('insurance.nationalId', 'National ID / Iqama')}</option>
              <option value="qualification">{t('insurance.qualification', 'Academic Degree')}</option>
              <option value="contract">{t('insurance.contract', 'Labor Contract')}</option>
              <option value="insurance">{t('insurance.title', 'Insurance Document')}</option>
              <option value="birth_certificate">{t('insurance.birthCert', 'Birth Certificate')}</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">{t('documents.allStatuses', 'All Statuses')}</option>
              <option value="verified">{t('documents.statusVerified', 'Verified')}</option>
              <option value="under_review">{t('documents.statusUnderReview', 'Under Review')}</option>
              <option value="missing">{t('documents.statusMissing', 'Missing')}</option>
              <option value="rejected">{t('documents.statusRejected', 'Rejected')}</option>
              <option value="expired">{t('documents.statusExpired', 'Expired')}</option>
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
          title={`Document Preview: ${previewDoc.title}`}
          description={`Employee: ${previewDoc.employeeName} (${previewDoc.department})`}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500">File ID: {previewDoc.id}</span>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => {
                  success(`Downloading ${previewDoc.fileName}...`);
                  setPreviewDoc(null);
                }}
              >
                Download PDF
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-100 rounded-xl p-8 border border-slate-200 flex flex-col items-center justify-center text-center">
              <FileText className="w-16 h-16 text-slate-400 mb-3" />
              <h4 className="text-sm font-semibold text-slate-800">{previewDoc.fileName}</h4>
              <p className="text-xs text-slate-500 mt-1">
                Simulated Enterprise PDF Document • {previewDoc.fileSize}
              </p>
              <div className="mt-4 flex gap-2">
                {getStatusBadge(previewDoc.status)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Stamp:</span>
                <span className="font-semibold text-slate-800">{previewDoc.verifiedBy || 'Pending verification'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiry Horizon:</span>
                <span className="font-semibold text-slate-800">{previewDoc.expiryDate || 'No expiration set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Compliance Notes:</span>
                <span className="font-medium text-slate-800">{previewDoc.notes || 'No annotations recorded.'}</span>
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
          title="Reject Document"
          description={`Rejecting ${rejectingDoc.title} for ${rejectingDoc.employeeName}`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setRejectingDoc(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!rejectionReason.trim()}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Mandatory Rejection Reason *
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Scanned copy is illegible, signature missing on page 2, or document expired..."
              className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
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
          title="رفع وتوثيق مستند جديد"
          description="ارفع مستنداً رسمياً لربطه بملف الموظف والتوثيق المالي والقانوني"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            {employeeOptions.length > 0 ? (
              <Select
                label="الموظف صاحب المستند"
                required
                value={selectedUploadEmployeeId || employeeOptions[0]?.value}
                onChange={e => setSelectedUploadEmployeeId(e.target.value)}
                options={employeeOptions.map(e => ({ value: e.value, label: e.label }))}
              />
            ) : (
              <Input
                label="اسم الموظف"
                required
                value={uploadEmployeeName}
                onChange={e => setUploadEmployeeName(e.target.value)}
              />
            )}

            <Select
              label="نوع وتصنيف المستند"
              required
              value={uploadType}
              onChange={e => setUploadType(e.target.value as DocumentType)}
              options={[
                { value: 'national_id', label: 'بطاقة الرقم القومي (National ID)' },
                { value: 'qualification', label: 'المؤهل الدراسي (Degree Certificate)' },
                { value: 'contract', label: 'عقد العمل الموقع (Signed Contract)' },
                { value: 'insurance', label: 'استمارة وسجل التأمينات (Insurance Form)' },
                { value: 'birth_certificate', label: 'شهادة الميلاد (Birth Certificate)' },
                { value: 'medical', label: 'الكشف الطبي وفيش جنائي (Medical / Clearance)' },
                { value: 'other', label: 'مستند رسمي آخر (Other Document)' },
              ]}
            />

            <Input
              label="عنوان أو وصف المستند"
              required
              placeholder="مثال: بطاقة الرقم القومي - وجهين، عقد 2026..."
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
            />

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
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
                <Upload className="w-8 h-8 text-brand-600 mx-auto mb-2" />
                {selectedUploadFile ? (
                  <div>
                    <p className="text-xs font-bold text-slate-800">{selectedUploadFile.name}</p>
                    <p className="text-[11px] text-emerald-600 mt-1">
                      تم اختيار الملف ({(selectedUploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-700">اضغط هنا لاختيار ملف من جهازك</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">يدعم PDF, PNG, JPG حتى 15MB</p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsUploadOpen(false)}>
                إلغاء
              </Button>
              <Button variant="primary" size="sm" type="submit">
                رفع وحفظ المستند
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
        title={t('documents.confirmDeleteAllTitle', 'تأكيد حذف جميع المستندات')}
        message={t('documents.confirmDeleteAllMessage', { count: documents.length })}
        confirmLabel={t('documents.confirmDeleteAllButton', 'نعم، حذف جميع المستندات نهائياً')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Bulk Delete Documents Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDeleteDocs}
        title={t('documents.confirmBulkDeleteTitle', 'تأكيد حذف المستندات المحددة')}
        message={t('documents.confirmBulkDeleteMessage', { count: selectedDocIds.length })}
        confirmLabel={t('documents.confirmBulkDeleteButton', 'حذف المحدد نهائياً')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Single Delete Document Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleConfirmSingleDeleteDoc}
        title={t('documents.confirmSingleDeleteTitle', 'تأكيد حذف المستند')}
        message={t('documents.confirmSingleDeleteMessage', { name: deletingDoc?.title || deletingDoc?.fileName || '' })}
        confirmLabel={t('documents.confirmSingleDeleteButton', 'حذف نهائي')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />
    </div>
  );
};
