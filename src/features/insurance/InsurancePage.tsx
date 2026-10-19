import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  Search,
  Users,
  Check,
  ChevronRight,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  useSocialInsurance,
  useMissingDocuments,
  useInsuranceStats,
  useToggleDocumentMutation,
} from '../../hooks/queries';
import { mockDepartments } from '../../mocks/departments';
import { SocialInsuranceRecord, MissingDocumentRecord } from '../../types';
import { ExcelImportModal, ImportTargetType } from '../../components/ui/ExcelImportModal';
import { insuranceService } from '../../services/insuranceService';
import { cn } from '../../lib/utils';

type ActiveTab = 'social_insurance' | 'missing_documents' | 'reconciliation';

export const InsurancePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { success, info, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('social_insurance');

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedListStatus, setSelectedListStatus] = useState<string>('all');
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>('all');

  // Excel Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<ImportTargetType>('social_insurance');

  // Selection & Deletion for Social Insurance
  const [selectedSocialIds, setSelectedSocialIds] = useState<string[]>([]);
  const [isDeleteAllSocialModalOpen, setIsDeleteAllSocialModalOpen] = useState(false);
  const [isBulkDeleteSocialModalOpen, setIsBulkDeleteSocialModalOpen] = useState(false);
  const [deletingSocialRecord, setDeletingSocialRecord] = useState<SocialInsuranceRecord | null>(null);

  // Selection & Deletion for Missing Documents
  const [selectedMissingIds, setSelectedMissingIds] = useState<string[]>([]);
  const [isDeleteAllMissingModalOpen, setIsDeleteAllMissingModalOpen] = useState(false);
  const [isBulkDeleteMissingModalOpen, setIsBulkDeleteMissingModalOpen] = useState(false);
  const [deletingMissingRecord, setDeletingMissingRecord] = useState<MissingDocumentRecord | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // Memoized query params for optimal React Query caching
  const socialParams = useMemo(
    () => ({
      department: selectedDept !== 'all' ? selectedDept : undefined,
      employeeListStatus: selectedListStatus as any,
    }),
    [selectedDept, selectedListStatus]
  );

  const missingParams = useMemo(
    () => ({
      department: selectedDept !== 'all' ? selectedDept : undefined,
      missingDoc: selectedDocFilter as any,
    }),
    [selectedDept, selectedDocFilter]
  );

  // React Query cached hooks (Zero redundant network calls)
  const {
    data: socialRecords = [],
    isLoading: isLoadingSocial,
    refetch: refetchSocial,
  } = useSocialInsurance(socialParams);

  const {
    data: missingRecords = [],
    isLoading: isLoadingMissing,
    refetch: refetchMissing,
  } = useMissingDocuments(missingParams);

  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useInsuranceStats();

  const toggleMutation = useToggleDocumentMutation();

  const stats = statsData || {
    insuredCount: 0,
    notInsuredCount: 0,
    notFoundCount: 0,
    totalInsuredRows: 0,
    totalSalary: 0,
    totalWorkerShare: 0,
    totalCompanyShare: 0,
    totalContributions: 0,
    incompleteDocsCount: 0,
    completeDocsCount: 0,
    totalMissingDocs: 0,
    totalEmployees: 0,
  };

  const isLoading = isLoadingSocial || isLoadingMissing || isLoadingStats;

  const handleRefetch = () => {
    refetchSocial();
    refetchMissing();
    refetchStats();
  };

  const openImporter = (target: ImportTargetType) => {
    setModalTarget(target);
    setIsImportModalOpen(true);
  };

  const handleToggleDoc = async (
    recordId: string,
    field: 'qualificationCert' | 'birthCert' | 'idCard' | 'contract'
  ) => {
    try {
      const updated = await toggleMutation.mutateAsync({ id: recordId, docType: field });
      success(`تم تحديث حالة المستند للموظف ${updated.employeeName}`);
    } catch (err: any) {
      toastError(err?.message || 'حدث خطأ أثناء تحديث المستند');
    }
  };

  // Social Insurance Selection & Delete Handlers
  const isAllSocialSelected = socialRecords.length > 0 && socialRecords.every(r => selectedSocialIds.includes(r.id));
  const isSomeSocialSelected = socialRecords.some(r => selectedSocialIds.includes(r.id)) && !isAllSocialSelected;

  const handleToggleSelectAllSocial = () => {
    if (isAllSocialSelected) {
      setSelectedSocialIds([]);
    } else {
      setSelectedSocialIds(socialRecords.map(r => r.id));
    }
  };

  const handleExportSelectedSocial = () => {
    const selectedRows = socialRecords.filter(r => selectedSocialIds.includes(r.id));
    if (selectedRows.length > 0) {
      const wb = XLSX.utils.book_new();
      const rows = selectedRows.map(r => ({
        No: r.serialNo,
        'ID.': r.nationalId,
        Name: r.employeeName,
        Department: r.department,
        'Insurance Number': r.insuranceNumber,
        'Insurance Salary': r.insuranceSalary,
        'Worker Share (11%)': r.workerShare,
        'Company Share (18.75%)': r.companyShare,
        Total: r.workerShare + r.companyShare,
        Note: r.note || '',
        Status: r.employeeListStatus === 'found' ? 'Found' : 'Not Found',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Selected Social Insurance');
      XLSX.writeFile(wb, 'Selected_Social_Insurance_Records.xlsx');
      success(`تم تصدير ${selectedRows.length} سجل تأمينات بنجاح.`);
    }
  };

  const handleConfirmDeleteAllSocial = async () => {
    setIsDeleting(true);
    try {
      const count = await insuranceService.deleteAllSocialInsurance();
      success(t('insurance.deleteAllSocialSuccess', { count }) || `تم حذف جميع سجلات التأمينات (${count} سجل) بنجاح.`);
      setSelectedSocialIds([]);
      setIsDeleteAllSocialModalOpen(false);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || 'فشل حذف سجلات التأمينات.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDeleteSocial = async () => {
    setIsDeleting(true);
    try {
      const count = await insuranceService.bulkDeleteSocialInsurance(selectedSocialIds);
      success(t('insurance.bulkDeleteSocialSuccess', { count }) || `تم حذف ${count} سجل تأمينات محدد بنجاح.`);
      setSelectedSocialIds([]);
      setIsBulkDeleteSocialModalOpen(false);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || 'فشل حذف السجلات المحددة.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSingleDeleteSocial = async () => {
    if (!deletingSocialRecord) return;
    setIsDeleting(true);
    try {
      await insuranceService.deleteSocialInsurance(deletingSocialRecord.id);
      success(`تم حذف سجل التأمينات للموظف "${deletingSocialRecord.employeeName}" بنجاح.`);
      setSelectedSocialIds(prev => prev.filter(id => id !== deletingSocialRecord.id));
      setDeletingSocialRecord(null);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || 'فشل حذف السجل.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Missing Documents Selection & Delete Handlers
  const isAllMissingSelected = missingRecords.length > 0 && missingRecords.every(r => selectedMissingIds.includes(r.id));
  const isSomeMissingSelected = missingRecords.some(r => selectedMissingIds.includes(r.id)) && !isAllMissingSelected;

  const handleToggleSelectAllMissing = () => {
    if (isAllMissingSelected) {
      setSelectedMissingIds([]);
    } else {
      setSelectedMissingIds(missingRecords.map(r => r.id));
    }
  };

  const handleExportSelectedMissing = () => {
    const selectedRows = missingRecords.filter(r => selectedMissingIds.includes(r.id));
    if (selectedRows.length > 0) {
      const wb = XLSX.utils.book_new();
      const rows = selectedRows.map(r => ({
        No: r.serialNo,
        Department: r.department,
        Name: r.employeeName,
        ID: r.nationalId,
        Position: r.position,
        'Employee ID': r.employeeCode,
        'Insurance Status': r.insuranceStatus,
        'Qualification Cert': r.qualificationCert,
        'Birth Cert': r.birthCert,
        'ID Card': r.idCard,
        Contract: r.contract,
        Status: r.status,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Selected Missing Documents');
      XLSX.writeFile(wb, 'Selected_Missing_Documents_Records.xlsx');
      success(`تم تصدير ${selectedRows.length} سجل نواقص بنجاح.`);
    }
  };

  const handleConfirmDeleteAllMissing = async () => {
    setIsDeleting(true);
    try {
      const count = await insuranceService.deleteAllMissingDocuments();
      success(t('insurance.deleteAllMissingSuccess', { count }) || `تم حذف جميع سجلات النواقص (${count} سجل) بنجاح.`);
      setSelectedMissingIds([]);
      setIsDeleteAllMissingModalOpen(false);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || 'فشل حذف سجلات النواقص.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDeleteMissing = async () => {
    setIsDeleting(true);
    try {
      const count = await insuranceService.bulkDeleteMissingDocuments(selectedMissingIds);
      success(t('insurance.bulkDeleteMissingSuccess', { count }) || `تم حذف ${count} سجل نواقص محدد بنجاح.`);
      setSelectedMissingIds([]);
      setIsBulkDeleteMissingModalOpen(false);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || 'فشل حذف السجلات المحددة.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSingleDeleteMissing = async () => {
    if (!deletingMissingRecord) return;
    setIsDeleting(true);
    try {
      await insuranceService.deleteMissingDocument(deletingMissingRecord.id);
      success(`تم حذف سجل النواقص للموظف "${deletingMissingRecord.employeeName}" بنجاح.`);
      setSelectedMissingIds(prev => prev.filter(id => id !== deletingMissingRecord.id));
      setDeletingMissingRecord(null);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || 'فشل حذف السجل.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCurrentSheet = () => {
    const wb = XLSX.utils.book_new();

    if (activeTab === 'social_insurance') {
      const rows = socialRecords.map(r => ({
        No: r.serialNo,
        'ID.': r.nationalId,
        Name: r.employeeName,
        Department: r.department,
        'Insurance Number': r.insuranceNumber,
        'Insurance Salary': r.insuranceSalary,
        Worker: r.workerShare,
        Company: r.companyShare,
        Note: r.note,
        'Employee List Status': r.employeeListStatus === 'found' ? 'Found' : 'Not Found',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Social Insurance - September');
      XLSX.writeFile(wb, 'Social_Insurance_September_Export.xlsx');
      info('تم تصدير شيت التأمينات الاجتماعية بنجاح');
    } else if (activeTab === 'missing_documents') {
      const rows = missingRecords.map(r => ({
        No: r.serialNo,
        Department: r.department,
        Name: r.employeeName,
        ID: r.nationalId,
        Position: r.position,
        'Start date': r.startDate,
        'Employee ID': r.employeeCode,
        'Insurance Status': r.insuranceStatus === 'insured' ? 'Insured' : 'Not Insured',
        'Qualification Certificate': r.qualificationCert === 'available' ? 'Available' : 'Missing',
        'Birth Certificate': r.birthCert === 'available' ? 'Available' : 'Missing',
        'ID Card': r.idCard === 'available' ? 'Available' : 'Missing',
        Contract: r.contract === 'available' ? 'Available' : 'Missing',
        Notes: r.notes || '',
        Status: r.status === 'complete' ? 'Complete' : 'Incomplete',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Missing Documents');
      XLSX.writeFile(wb, 'Missing_Documents_Export.xlsx');
      info('تم تصدير شيت الأوراق الناقصة بنجاح');
    }
  };

  // Columns for Tab 1: Social Insurance - September
  const socialColumns: Column<SocialInsuranceRecord>[] = useMemo(
    () => [
      {
        key: 'serialNo',
        header: t('insurance.colSerialNo', 'No'),
        width: '50px',
        render: row => <span className="font-mono text-slate-400 text-xs">{row.serialNo}</span>,
      },
      {
        key: 'nationalId',
        header: t('insurance.colNationalId', 'ID (الرقم القومي)'),
        sortable: true,
        render: row => (
          <span className="font-mono text-xs font-semibold text-slate-800 tracking-wider">
            {row.nationalId}
          </span>
        ),
      },
      {
        key: 'employeeName',
        header: t('insurance.colEmployeeName', 'Name (الاسم)'),
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 block text-xs">{row.employeeName}</span>
            {row.employeeCode && (
              <span className="text-[10px] font-mono text-brand-600 block">
                {t('insurance.colCodePrefix', 'كود:')} {row.employeeCode}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'department',
        header: t('insurance.colDepartment', 'Department (القسم)'),
        sortable: true,
        render: row => (
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
            {row.department}
          </span>
        ),
      },
      {
        key: 'insuranceNumber',
        header: t('insurance.colInsuranceNumber', 'Insurance Number (الرقم التأميني)'),
        sortable: true,
        render: row => (
          <span className="font-mono text-xs font-bold text-slate-900">{row.insuranceNumber}</span>
        ),
      },
      {
        key: 'insuranceSalary',
        header: t('insurance.colInsuranceSalary', 'Insurance Salary (الأجر)'),
        sortable: true,
        render: row => (
          <span className="font-mono text-xs text-slate-800">
            {row.insuranceSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('insurance.currency', 'ج.م')}
          </span>
        ),
      },
      {
        key: 'workerShare',
        header: t('insurance.colWorkerShare', 'Worker (العامل 11%)'),
        render: row => (
          <span className="font-mono text-xs text-slate-600">
            {row.workerShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        key: 'companyShare',
        header: t('insurance.colCompanyShare', 'Company (الشركة 18.75%)'),
        render: row => (
          <span className="font-mono text-xs font-semibold text-slate-800">
            {row.companyShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        key: 'note',
        header: t('insurance.colNote', 'Note (ملاحظات)'),
        render: row => (
          <span className="text-[11px] text-slate-500 font-mono">{row.note || '—'}</span>
        ),
      },
      {
        key: 'employeeListStatus',
        header: t('insurance.colMatchStatus', 'Employee List Status (المطابقة)'),
        sortable: true,
        render: row => {
          if (row.employeeListStatus === 'found') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {t('insurance.statusMatched', 'مسجل ومطابق')}
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 animate-pulse">
              <ShieldAlert className="w-3 h-3 text-rose-600" /> {t('insurance.statusNotRegistered', 'غير مسجل بشيت الموظفين')}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: t('common.actions', 'إجراءات'),
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end">
            <button
              onClick={() => setDeletingSocialRecord(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title={t('insurance.deleteSingleTooltip', 'حذف هذا السجل نهائياً')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [t]
  );

  // Columns for Tab 2: Missing Documents
  const missingColumns: Column<MissingDocumentRecord>[] = useMemo(
    () => [
      {
        key: 'serialNo',
        header: t('insurance.colSerialNo', 'No'),
        width: '45px',
        render: row => <span className="font-mono text-slate-400 text-xs">{row.serialNo}</span>,
      },
      {
        key: 'department',
        header: t('insurance.colDepartment', 'Department (القسم)'),
        render: row => (
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {row.department}
          </span>
        ),
      },
      {
        key: 'employeeName',
        header: t('insurance.colEmployeeName', 'Name (اسم الموظف)'),
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 block text-xs">{row.employeeName}</span>
            <span className="text-[10px] font-mono text-slate-400 block">{row.nationalId}</span>
          </div>
        ),
      },
      {
        key: 'position',
        header: t('insurance.colPosition', 'Position (الوظيفة)'),
        render: row => (
          <span className="text-xs font-medium text-slate-800 block">{row.position}</span>
        ),
      },
      {
        key: 'employeeCode',
        header: t('insurance.colEmployeeId', 'Employee ID'),
        render: row => <span className="font-mono text-xs text-slate-600">{row.employeeCode}</span>,
      },
      {
        key: 'qualificationCert',
        header: t('insurance.qualification', 'شهادة المؤهل'),
        render: row => (
          <button
            type="button"
            onClick={() => handleToggleDoc(row.id, 'qualificationCert')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1 ${
              row.qualificationCert === 'available'
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
            }`}
          >
            {row.qualificationCert === 'available' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {row.qualificationCert === 'available' ? t('insurance.docAvailable', 'متوفر') : t('insurance.docMissing', 'Missing')}
          </button>
        ),
      },
      {
        key: 'birthCert',
        header: t('insurance.birthCert', 'شهادة الميلاد'),
        render: row => (
          <button
            type="button"
            onClick={() => handleToggleDoc(row.id, 'birthCert')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1 ${
              row.birthCert === 'available'
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
            }`}
          >
            {row.birthCert === 'available' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {row.birthCert === 'available' ? t('insurance.docAvailable', 'متوفر') : t('insurance.docMissing', 'Missing')}
          </button>
        ),
      },
      {
        key: 'idCard',
        header: t('insurance.nationalId', 'بطاقة الرقم القومي'),
        render: row => (
          <button
            type="button"
            onClick={() => handleToggleDoc(row.id, 'idCard')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1 ${
              row.idCard === 'available'
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
            }`}
          >
            {row.idCard === 'available' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {row.idCard === 'available' ? t('insurance.docAvailable', 'متوفر') : t('insurance.docMissing', 'Missing')}
          </button>
        ),
      },
      {
        key: 'contract',
        header: t('insurance.contract', 'عقد العمل'),
        render: row => (
          <button
            type="button"
            onClick={() => handleToggleDoc(row.id, 'contract')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1 ${
              row.contract === 'available'
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
            }`}
          >
            {row.contract === 'available' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {row.contract === 'available' ? t('insurance.docAvailable', 'متوفر') : t('insurance.docMissing', 'Missing')}
          </button>
        ),
      },
      {
        key: 'status',
        header: t('insurance.colStatus', 'Status (الحالة)'),
        sortable: true,
        render: row => {
          if (row.status === 'complete') {
            return <Badge variant="success">{t('insurance.statusComplete', 'مكتمل (Complete)')}</Badge>;
          }
          return (
            <Badge variant="danger">
              {t('insurance.statusIncomplete', { count: row.missingCount }) || `ناقص (${row.missingCount} ملفات)`}
            </Badge>
          );
        },
      },
      {
        key: 'actions',
        header: t('common.actions', 'إجراءات'),
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end">
            <button
              onClick={() => setDeletingMissingRecord(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title={t('insurance.deleteSingleTooltip', 'حذف هذا السجل نهائياً')}
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
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t('insurance.pageTitle', 'إدارة التأمينات الاجتماعية ومسوغات التعيين')}
            </h1>
            <span className="bg-brand-50 text-brand-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-brand-200">
              {t('insurance.excelSynchronized', 'Excel Synchronized')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('insurance.pageSubtitle', 'إدارة متطابقة 100% مع شيتات الإكسيل (All Employees • Social Insurance • Missing Documents).')}
          </p>
        </div>

        {/* Action Buttons: Import, Template, Export */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleRefetch}
            isLoading={isLoading}
          >
            {t('common.refresh', 'تحديث')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
            onClick={handleExportCurrentSheet}
          >
            {t('insurance.exportToExcel', 'تصدير إلى إكسيل (.xlsx)')}
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => openImporter(activeTab === 'missing_documents' ? 'missing_documents' : 'social_insurance')}
          >
            {t('insurance.importExcel', 'استيراد شيت إكسيل / CSV')}
          </Button>
        </div>
      </div>

      {/* KPI Cards Matching User's Excel Summary Box Exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Insured */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                {t('insurance.kpiInsured', 'المؤمن عليهم (Insured)')}
              </span>
              <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">
                {stats.insuredCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {t('insurance.kpiInsuredSub', 'مسجلين بالتأمينات ومطابقين')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Not Insured */}
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                {t('insurance.kpiNotInsured', 'غير مؤمن عليهم (Not Insured)')}
              </span>
              <span className="text-3xl font-extrabold text-rose-600 mt-1 block">
                {stats.notInsuredCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {t('insurance.kpiNotInsuredSub', 'في انتظار استكمال مسوغات التعيين')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Not Found in Employee List */}
        <Card
          onClick={() => {
            setActiveTab('social_insurance');
            setSelectedListStatus(selectedListStatus === 'not_found' ? 'all' : 'not_found');
          }}
          className={`cursor-pointer transition-all border-l-4 border-l-amber-500 hover:shadow-md ${
            selectedListStatus === 'not_found' ? 'ring-2 ring-amber-500 bg-amber-50/30' : ''
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                  {t('insurance.kpiNotFound', 'غير مسجلين بشيت الموظفين')}
                </span>
                <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded text-[9px] font-bold">
                  {t('insurance.alertBadge', 'تنبيه')}
                </span>
              </div>
              <span className="text-3xl font-extrabold text-amber-600 mt-1 block">
                {stats.notFoundCount}
              </span>
              <span className="text-[11px] text-amber-800 font-semibold underline">
                {selectedListStatus === 'not_found' ? t('insurance.clearFilter', 'إلغاء الفلترة') : t('insurance.clickToFilter', 'اضغط للفلترة والمطابقة')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Monthly Social Contributions Total */}
        <Card className="border-l-4 border-l-brand-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider block">
                {t('insurance.kpiMonthlyBill', 'فاتورة التأمينات الشهرية')}
              </span>
              <span className="text-2xl font-extrabold text-brand-600 mt-1 block font-mono">
                {(stats.totalContributions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('insurance.currency', 'ج.م')}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {t('insurance.kpiMonthlyBillSub', 'حصة العامل 11% + الشركة 18.75%')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-brand-50 text-brand-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation Matching Excel Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('social_insurance')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs border-b-2 transition-all ${
            activeTab === 'social_insurance'
              ? 'border-brand-600 text-brand-600 bg-brand-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('insurance.tabSocialInsurance', 'شيت التأمينات الاجتماعية (Social Insurance)')}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {stats.totalInsuredRows}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('missing_documents')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs border-b-2 transition-all ${
            activeTab === 'missing_documents'
              ? 'border-brand-600 text-brand-600 bg-brand-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>{t('insurance.tabMissingDocs', 'شيت الأوراق ومسوغات التعيين الناقصة (Missing Documents)')}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
            {stats.incompleteDocsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs border-b-2 transition-all ${
            activeTab === 'reconciliation'
              ? 'border-brand-600 text-brand-600 bg-brand-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('insurance.tabReconciliation', 'تقرير المطابقة الرقابية (Reconciliation)')}</span>
          {stats.notFoundCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold animate-pulse">
              {t('insurance.tabAlertCount', { count: stats.notFoundCount })}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1 Content: Social Insurance */}
      {activeTab === 'social_insurance' && (
        <div className="space-y-4">
          <DataTable
            columns={socialColumns}
            data={socialRecords}
            keyExtractor={row => row.id}
            isLoading={isLoading}
            searchable
            searchPlaceholder={t('insurance.searchSocialPlaceholder', 'بحث بالاسم، الرقم القومي، أو الرقم التأميني...')}
            exportFilename="Social_Insurance_September_List"
            selectable
            selectAllAcrossPages
            selectedIds={selectedSocialIds}
            onSelectionChange={setSelectedSocialIds}
            bulkActions={(ids, clear) => (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSocialIds(socialRecords.map(r => r.id))}
                  disabled={ids.length === socialRecords.length}
                >
                  {t('insurance.selectAllSocial', 'تحديد الكل')} ({socialRecords.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleExportSelectedSocial}
                >
                  {t('insurance.exportSelected', 'تصدير المحدد')} ({ids.length})
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    if (ids.length === socialRecords.length) {
                      setIsDeleteAllSocialModalOpen(true);
                    } else {
                      setIsBulkDeleteSocialModalOpen(true);
                    }
                  }}
                >
                  {ids.length === socialRecords.length
                    ? t('insurance.deleteAllSocial', 'حذف جميع سجلات التأمينات')
                    : t('insurance.deleteSelectedSocial', { count: ids.length }) || `حذف المحدد (${ids.length})`}
                </Button>
                <Button variant="ghost" size="sm" onClick={clear}>
                  {t('insurance.clearSelection', 'إلغاء التحديد')}
                </Button>
              </div>
            )}
            filtersSlot={
              <div className="flex flex-wrap items-center gap-2">
                {/* خانة تحديد كل سجلات التأمينات */}
                <label
                  title={isAllSocialSelected ? t('insurance.clearSelection', 'إلغاء التحديد') : t('insurance.selectAllSocial', 'تحديد الكل')}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all shadow-sm select-none',
                    isAllSocialSelected
                      ? 'bg-brand-50 border-brand-400 text-brand-800 ring-1 ring-brand-300'
                      : isSomeSocialSelected
                      ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isAllSocialSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomeSocialSelected && !isAllSocialSelected;
                    }}
                    onChange={handleToggleSelectAllSocial}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer accent-brand-600"
                  />
                  <span className="whitespace-nowrap">
                    {isAllSocialSelected
                      ? t('insurance.allSocialSelectedCount', { count: socialRecords.length }) || `تم تحديد كل التأمينات (${socialRecords.length})`
                      : isSomeSocialSelected
                      ? t('insurance.selectedCountOf', { selected: selectedSocialIds.length, total: socialRecords.length }) || `محدد (${selectedSocialIds.length} من ${socialRecords.length})`
                      : t('insurance.selectAllSocialCount', { count: socialRecords.length }) || `تحديد كل التأمينات (${socialRecords.length})`}
                  </span>
                </label>

                {/* Department filter */}
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="all">{t('insurance.allDepts', 'جميع الأقسام (All Depts)')}</option>
                  <option value="HR">HR</option>
                  <option value="PD">PD</option>
                  <option value="SD">SD</option>
                  <option value="DC">DC</option>
                  <option value="PuD">PuD</option>
                  <option value="FD">FD</option>
                </select>

                {/* Status filter */}
                <select
                  value={selectedListStatus}
                  onChange={e => setSelectedListStatus(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-semibold"
                >
                  <option value="all">{t('insurance.allMatchStatus', 'حالة المطابقة: الكل')}</option>
                  <option value="found">{t('insurance.filterFound', 'مسجل ومطابق بشيت الموظفين (Found)')}</option>
                  <option value="not_found">{t('insurance.filterNotFound', 'غير مسجل بشيت الموظفين (Not Found)')}</option>
                </select>

                {socialRecords.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsDeleteAllSocialModalOpen(true)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  >
                    {t('insurance.deleteAllSocial', 'حذف جميع سجلات التأمينات')}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openImporter('social_insurance')}
                  leftIcon={<Upload className="w-3 h-3" />}
                >
                  {t('insurance.importSocialBtn', 'استيراد شيت التأمينات')}
                </Button>
              </div>
            }
          />
        </div>
      )}

      {/* Tab 2 Content: Missing Documents */}
      {activeTab === 'missing_documents' && (
        <div className="space-y-4">
          <DataTable
            columns={missingColumns}
            data={missingRecords}
            keyExtractor={row => row.id}
            isLoading={isLoading}
            searchable
            searchPlaceholder={t('insurance.searchMissingPlaceholder', 'بحث في النواقص بالاسم، الوظيفة، أو كود الموظف...')}
            exportFilename="Missing_Documents_Audit_List"
            selectable
            selectAllAcrossPages
            selectedIds={selectedMissingIds}
            onSelectionChange={setSelectedMissingIds}
            bulkActions={(ids, clear) => (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMissingIds(missingRecords.map(r => r.id))}
                  disabled={ids.length === missingRecords.length}
                >
                  {t('insurance.selectAllMissing', 'تحديد الكل')} ({missingRecords.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleExportSelectedMissing}
                >
                  {t('insurance.exportSelected', 'تصدير المحدد')} ({ids.length})
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    if (ids.length === missingRecords.length) {
                      setIsDeleteAllMissingModalOpen(true);
                    } else {
                      setIsBulkDeleteMissingModalOpen(true);
                    }
                  }}
                >
                  {ids.length === missingRecords.length
                    ? t('insurance.deleteAllMissing', 'حذف جميع سجلات النواقص')
                    : t('insurance.deleteSelectedMissing', { count: ids.length }) || `حذف المحدد (${ids.length})`}
                </Button>
                <Button variant="ghost" size="sm" onClick={clear}>
                  {t('insurance.clearSelection', 'إلغاء التحديد')}
                </Button>
              </div>
            )}
            filtersSlot={
              <div className="flex flex-wrap items-center gap-2">
                {/* خانة تحديد كل سجلات النواقص */}
                <label
                  title={isAllMissingSelected ? t('insurance.clearSelection', 'إلغاء التحديد') : t('insurance.selectAllMissing', 'تحديد الكل')}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all shadow-sm select-none',
                    isAllMissingSelected
                      ? 'bg-brand-50 border-brand-400 text-brand-800 ring-1 ring-brand-300'
                      : isSomeMissingSelected
                      ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isAllMissingSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomeMissingSelected && !isAllMissingSelected;
                    }}
                    onChange={handleToggleSelectAllMissing}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer accent-brand-600"
                  />
                  <span className="whitespace-nowrap">
                    {isAllMissingSelected
                      ? t('insurance.allMissingSelectedCount', { count: missingRecords.length }) || `تم تحديد كل النواقص (${missingRecords.length})`
                      : isSomeMissingSelected
                      ? t('insurance.selectedCountOf', { selected: selectedMissingIds.length, total: missingRecords.length }) || `محدد (${selectedMissingIds.length} من ${missingRecords.length})`
                      : t('insurance.selectAllMissingCount', { count: missingRecords.length }) || `تحديد كل النواقص (${missingRecords.length})`}
                  </span>
                </label>

                <select
                  value={selectedDocFilter}
                  onChange={e => setSelectedDocFilter(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-semibold"
                >
                  <option value="all">{t('insurance.filterAllMissing', 'جميع النواقص')}</option>
                  <option value="qualification">{t('insurance.filterMissingQual', 'نواقص شهادة المؤهل')}</option>
                  <option value="birth">{t('insurance.filterMissingBirth', 'نواقص شهادة الميلاد')}</option>
                  <option value="idCard">{t('insurance.filterMissingId', 'نواقص بطاقة الرقم القومي')}</option>
                  <option value="contract">{t('insurance.filterMissingContract', 'نواقص عقد العمل')}</option>
                </select>

                {missingRecords.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsDeleteAllMissingModalOpen(true)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  >
                    {t('insurance.deleteAllMissing', 'حذف جميع سجلات النواقص')}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openImporter('missing_documents')}
                  leftIcon={<Upload className="w-3 h-3" />}
                >
                  {t('insurance.importMissingBtn', 'استيراد شيت النواقص')}
                </Button>
              </div>
            }
          />
        </div>
      )}

      {/* Tab 3 Content: Reconciliation & Audit */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          {stats.notFoundCount > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-amber-900">
                    {t('insurance.reconcileDiscrepancyTitle', 'تقرير الفروقات الرقابية بين شيت التأمينات وقاعدة الموظفين')}
                  </h3>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {t('insurance.reconcileDiscrepancyDesc', { count: stats.notFoundCount })}
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedListStatus('not_found');
                        setActiveTab('social_insurance');
                      }}
                    >
                      {t('insurance.viewDiscrepancyEmployeesBtn', { count: stats.notFoundCount })}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-emerald-900">
                    {t('insurance.reconcileCleanTitle', 'المطابقة الرقابية سليمة 100%')}
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {t('insurance.reconcileCleanDesc', 'لا توجد أي فروقات رقابية أو موظفون مسجلون بالتأمينات دون وجودهم في كشوفات العاملين.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t('insurance.matchedEmployeesTitle', { count: stats.insuredCount })}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('insurance.matchedEmployeesDesc', 'موظفون يعملون حالياً ومسجلون رسمياً في التأمينات الاجتماعية ويتم احتساب حصة العامل (11%) وحصة الشركة (18.75%).')}
              </p>
              <div className="bg-emerald-50 rounded-xl p-3 text-xs text-emerald-800 font-mono">
                {t('insurance.totalMonthlyInsuranceWage', { amount: stats.totalSalary.toLocaleString('en-US', { minimumFractionDigits: 2 }) })}
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                {t('insurance.uninsuredEmployeesTitle', { count: stats.notInsuredCount })}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('insurance.uninsuredEmployeesDesc', 'يعملون في الشركة ولكن لم يتم إدراجهم في شيت التأمينات الاجتماعية نظراً لنقص مسوغات التعيين (المؤهل، الميلاد، الرقم القومي، العقد).')}
              </p>
              <div className="bg-rose-50 rounded-xl p-3 text-xs text-rose-800 font-mono">
                {t('insurance.readyForInsuranceHint', 'جاهز للتأمين بمجرد اكتمال ملف التعيين')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultTarget={modalTarget}
        onImportComplete={handleRefetch}
      />

      {/* Delete All Social Insurance Records Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllSocialModalOpen}
        onClose={() => setIsDeleteAllSocialModalOpen(false)}
        onConfirm={handleConfirmDeleteAllSocial}
        title={t('insurance.confirmDeleteAllSocialTitle', 'تأكيد حذف جميع سجلات التأمينات')}
        message={t('insurance.confirmDeleteAllSocialMessage', { count: socialRecords.length })}
        confirmLabel={t('insurance.confirmDeleteAllSocialButton', 'نعم، حذف جميع التأمينات نهائياً')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Bulk Delete Social Insurance Records Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteSocialModalOpen}
        onClose={() => setIsBulkDeleteSocialModalOpen(false)}
        onConfirm={handleConfirmBulkDeleteSocial}
        title={t('insurance.confirmBulkDeleteSocialTitle', 'تأكيد حذف سجلات التأمينات المحددة')}
        message={t('insurance.confirmBulkDeleteSocialMessage', { count: selectedSocialIds.length })}
        confirmLabel={t('insurance.confirmBulkDeleteSocialButton', 'حذف المحدد نهائياً')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Single Delete Social Insurance Record Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingSocialRecord}
        onClose={() => setDeletingSocialRecord(null)}
        onConfirm={handleConfirmSingleDeleteSocial}
        title={t('insurance.confirmSingleDeleteSocialTitle', 'تأكيد حذف سجل التأمينات')}
        message={t('insurance.confirmSingleDeleteSocialMessage', { name: deletingSocialRecord?.employeeName })}
        confirmLabel={t('insurance.confirmSingleDeleteSocialButton', 'حذف نهائي')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Delete All Missing Documents Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllMissingModalOpen}
        onClose={() => setIsDeleteAllMissingModalOpen(false)}
        onConfirm={handleConfirmDeleteAllMissing}
        title={t('insurance.confirmDeleteAllMissingTitle', 'تأكيد حذف جميع سجلات نواقص الملفات')}
        message={t('insurance.confirmDeleteAllMissingMessage', { count: missingRecords.length })}
        confirmLabel={t('insurance.confirmDeleteAllMissingButton', 'نعم، حذف جميع النواقص نهائياً')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Bulk Delete Missing Documents Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteMissingModalOpen}
        onClose={() => setIsBulkDeleteMissingModalOpen(false)}
        onConfirm={handleConfirmBulkDeleteMissing}
        title={t('insurance.confirmBulkDeleteMissingTitle', 'تأكيد حذف سجلات النواقص المحددة')}
        message={t('insurance.confirmBulkDeleteMissingMessage', { count: selectedMissingIds.length })}
        confirmLabel={t('insurance.confirmBulkDeleteMissingButton', 'حذف المحدد نهائياً')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Single Delete Missing Document Record Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingMissingRecord}
        onClose={() => setDeletingMissingRecord(null)}
        onConfirm={handleConfirmSingleDeleteMissing}
        title={t('insurance.confirmSingleDeleteMissingTitle', 'تأكيد حذف سجل النواقص')}
        message={t('insurance.confirmSingleDeleteMissingMessage', { name: deletingMissingRecord?.employeeName })}
        confirmLabel={t('insurance.confirmSingleDeleteMissingButton', 'حذف نهائي')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />
    </div>
  );
};
