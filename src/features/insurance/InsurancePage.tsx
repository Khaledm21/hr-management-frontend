import React, { useState, useMemo } from 'react';
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
  Users,
  Check,
  Trash2,
  FileText,
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
import { SocialInsuranceRecord, MissingDocumentRecord } from '../../types';
import { ExcelImportModal, ImportTargetType } from '../../components/ui/ExcelImportModal';
import { insuranceService } from '../../services/insuranceService';
import { InsuranceForm1GuideModal } from './components/InsuranceForm1GuideModal';
import { cn } from '../../lib/utils';

type ActiveTab = 'social_insurance' | 'missing_documents' | 'reconciliation';

export const InsurancePage: React.FC = () => {
  const { t } = useTranslation();
  const { success, info, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('social_insurance');

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedListStatus, setSelectedListStatus] = useState<string>('all');
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>('all');
  const [selectedDocStatusFilter, setSelectedDocStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');

  // Excel Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<ImportTargetType>('social_insurance');

  // Form 1 Guide Modal
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [selectedGuideRecord, setSelectedGuideRecord] = useState<SocialInsuranceRecord | null>(null);

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
      status: selectedDocStatusFilter !== 'all' ? selectedDocStatusFilter : undefined,
      missingDoc: selectedDocStatusFilter !== 'complete' && selectedDocFilter !== 'all' ? (selectedDocFilter as any) : undefined,
    }),
    [selectedDept, selectedDocStatusFilter, selectedDocFilter]
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
      success(t('insurance.docUpdatedSuccess', { name: updated.employeeName }));
    } catch (err: any) {
      toastError(err?.message || t('insurance.docUpdateError'));
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
      success(t('insurance.exportSocialSuccess', { count: selectedRows.length }));
    }
  };

  const handleConfirmDeleteAllSocial = async () => {
    setIsDeleting(true);
    try {
      const count = await insuranceService.deleteAllSocialInsurance();
      success(t('insurance.deleteAllSocialSuccess', { count }));
      setSelectedSocialIds([]);
      setIsDeleteAllSocialModalOpen(false);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || t('insurance.deleteAllSocialError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDeleteSocial = async () => {
    setIsDeleting(true);
    try {
      const count = await insuranceService.bulkDeleteSocialInsurance(selectedSocialIds);
      success(t('insurance.bulkDeleteSocialSuccess', { count }));
      setSelectedSocialIds([]);
      setIsBulkDeleteSocialModalOpen(false);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || t('insurance.bulkDeleteSocialError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSingleDeleteSocial = async () => {
    if (!deletingSocialRecord) return;
    setIsDeleting(true);
    try {
      await insuranceService.deleteSocialInsurance(deletingSocialRecord.id);
      success(t('insurance.singleDeleteSocialSuccess', { name: deletingSocialRecord.employeeName }));
      setSelectedSocialIds(prev => prev.filter(id => id !== deletingSocialRecord.id));
      setDeletingSocialRecord(null);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || t('insurance.singleDeleteSocialError'));
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
      success(t('insurance.exportMissingSuccess', { count: selectedRows.length }));
    }
  };

  const handleConfirmDeleteAllMissing = async () => {
    setIsDeleting(true);
    try {
      const count = await insuranceService.deleteAllMissingDocuments();
      success(t('insurance.deleteAllMissingSuccess', { count }));
      setSelectedMissingIds([]);
      setIsDeleteAllMissingModalOpen(false);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || t('insurance.deleteAllMissingError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDeleteMissing = async () => {
    setIsDeleting(true);
    try {
      const count = await insuranceService.bulkDeleteMissingDocuments(selectedMissingIds);
      success(t('insurance.bulkDeleteMissingSuccess', { count }));
      setSelectedMissingIds([]);
      setIsBulkDeleteMissingModalOpen(false);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || t('insurance.bulkDeleteMissingError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSingleDeleteMissing = async () => {
    if (!deletingMissingRecord) return;
    setIsDeleting(true);
    try {
      await insuranceService.deleteMissingDocument(deletingMissingRecord.id);
      success(t('insurance.singleDeleteMissingSuccess', { name: deletingMissingRecord.employeeName }));
      setSelectedMissingIds(prev => prev.filter(id => id !== deletingMissingRecord.id));
      setDeletingMissingRecord(null);
      handleRefetch();
    } catch (err: any) {
      toastError(err?.message || t('insurance.singleDeleteMissingError'));
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
      info(t('insurance.exportSocialSheetSuccess'));
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
      info(t('insurance.exportMissingSheetSuccess'));
    }
  };

  // Columns for Tab 1: Social Insurance - September
  const socialColumns: Column<SocialInsuranceRecord>[] = useMemo(
    () => [
      {
        key: 'serialNo',
        header: t('insurance.colSerialNo'),
        width: '50px',
        render: row => <span className="font-mono text-slate-400 text-xs">{row.serialNo}</span>,
      },
      {
        key: 'nationalId',
        header: t('insurance.colNationalId'),
        sortable: true,
        render: row => (
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-wider">
            {row.nationalId}
          </span>
        ),
      },
      {
        key: 'employeeName',
        header: t('insurance.colEmployeeName'),
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block text-xs">{row.employeeName}</span>
            {row.employeeCode && (
              <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 block">
                {t('insurance.colCodePrefix')} {row.employeeCode}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'department',
        header: t('insurance.colDepartment'),
        sortable: true,
        render: row => (
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {row.department}
          </span>
        ),
      },
      {
        key: 'insuranceNumber',
        header: t('insurance.colInsuranceNumber'),
        sortable: true,
        render: row => (
          <span className="font-mono text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">{row.insuranceNumber}</span>
        ),
      },
      {
        key: 'insuranceSalary',
        header: t('insurance.colInsuranceSalary'),
        sortable: true,
        render: row => (
          <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
            {row.insuranceSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('insurance.currency')}
          </span>
        ),
      },
      {
        key: 'workerShare',
        header: t('insurance.colWorkerShare'),
        render: row => (
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {row.workerShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        key: 'companyShare',
        header: t('insurance.colCompanyShare'),
        render: row => (
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {row.companyShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        key: 'note',
        header: t('insurance.colNote'),
        render: row => (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{row.note || '—'}</span>
        ),
      },
      {
        key: 'employeeListStatus',
        header: t('insurance.colMatchStatus'),
        sortable: true,
        render: row => {
          if (row.employeeListStatus === 'found') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {t('insurance.statusMatched')}
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900/50 animate-pulse">
              <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" /> {t('insurance.statusNotRegistered')}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => {
                setSelectedGuideRecord(row);
                setIsGuideModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              title="دليل تعبئة استمارة 1 تأمينات لهذا الموظف"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingSocialRecord(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title={t('insurance.deleteSingleTooltip')}
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
        header: t('insurance.colSerialNo'),
        width: '45px',
        render: row => <span className="font-mono text-slate-400 text-xs">{row.serialNo}</span>,
      },
      {
        key: 'department',
        header: t('insurance.colDepartment'),
        render: row => (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {row.department}
          </span>
        ),
      },
      {
        key: 'employeeName',
        header: t('insurance.colEmployeeName'),
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block text-xs">{row.employeeName}</span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">{row.nationalId}</span>
          </div>
        ),
      },
      {
        key: 'position',
        header: t('insurance.colPosition'),
        render: row => (
          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">{row.position}</span>
        ),
      },
      {
        key: 'employeeCode',
        header: t('insurance.colEmployeeId'),
        render: row => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{row.employeeCode}</span>,
      },
      {
        key: 'qualificationCert',
        header: t('insurance.qualification'),
        render: row => (
          <button
            type="button"
            onClick={() => handleToggleDoc(row.id, 'qualificationCert')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1 ${
              row.qualificationCert === 'available'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60'
            }`}
          >
            {row.qualificationCert === 'available' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {row.qualificationCert === 'available' ? t('insurance.docAvailable') : t('insurance.docMissing')}
          </button>
        ),
      },
      {
        key: 'birthCert',
        header: t('insurance.birthCert'),
        render: row => (
          <button
            type="button"
            onClick={() => handleToggleDoc(row.id, 'birthCert')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1 ${
              row.birthCert === 'available'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60'
            }`}
          >
            {row.birthCert === 'available' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {row.birthCert === 'available' ? t('insurance.docAvailable') : t('insurance.docMissing')}
          </button>
        ),
      },
      {
        key: 'idCard',
        header: t('insurance.nationalId'),
        render: row => (
          <button
            type="button"
            onClick={() => handleToggleDoc(row.id, 'idCard')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1 ${
              row.idCard === 'available'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60'
            }`}
          >
            {row.idCard === 'available' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {row.idCard === 'available' ? t('insurance.docAvailable') : t('insurance.docMissing')}
          </button>
        ),
      },
      {
        key: 'contract',
        header: t('insurance.contract'),
        render: row => (
          <button
            type="button"
            onClick={() => handleToggleDoc(row.id, 'contract')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1 ${
              row.contract === 'available'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60'
            }`}
          >
            {row.contract === 'available' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {row.contract === 'available' ? t('insurance.docAvailable') : t('insurance.docMissing')}
          </button>
        ),
      },
      {
        key: 'status',
        header: t('insurance.colStatus'),
        sortable: true,
        render: row => {
          if (row.status === 'complete') {
            return <Badge variant="success">{t('insurance.statusComplete')}</Badge>;
          }
          return (
            <Badge variant="danger">
              {t('insurance.statusIncomplete', { count: row.missingCount })}
            </Badge>
          );
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end">
            <button
              onClick={() => setDeletingMissingRecord(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title={t('insurance.deleteSingleTooltip')}
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#151D2E] p-5 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              {t('insurance.pageTitle')}
            </h1>
            <span className="bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-brand-200 dark:border-brand-800/60">
              {t('insurance.excelSynchronized')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('insurance.pageSubtitle')}
          </p>
        </div>

        {/* Action Buttons: Import, Template, Export */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            onClick={() => {
              setSelectedGuideRecord(null);
              setIsGuideModalOpen(true);
            }}
            className="border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-bold"
          >
            استمارة 1 تأمينات
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleRefetch}
            isLoading={isLoading}
          >
            {t('common.refresh')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            onClick={handleExportCurrentSheet}
          >
            {t('insurance.exportToExcel')}
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => openImporter(activeTab === 'missing_documents' ? 'missing_documents' : 'social_insurance')}
          >
            {t('insurance.importExcel')}
          </Button>
        </div>
      </div>

      {/* KPI Cards Matching User's Excel Summary Box Exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Insured */}
        <Card className="border-l-4 border-l-emerald-500 bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B] shadow-sm transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                {t('insurance.kpiInsured')}
              </span>
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {stats.insuredCount}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {t('insurance.kpiInsuredSub')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Not Insured */}
        <Card className="border-l-4 border-l-rose-500 bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B] shadow-sm transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                {t('insurance.kpiNotInsured')}
              </span>
              <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">
                {stats.notInsuredCount}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {t('insurance.kpiNotInsuredSub')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold">
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
          className={`cursor-pointer transition-all border-l-4 border-l-amber-500 bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B] hover:shadow-md ${
            selectedListStatus === 'not_found' ? 'ring-2 ring-amber-500 bg-amber-50/30 dark:bg-amber-950/30' : ''
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  {t('insurance.kpiNotFound')}
                </span>
                <span className="px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded text-[9px] font-bold">
                  {t('insurance.alertBadge')}
                </span>
              </div>
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
                {stats.notFoundCount}
              </span>
              <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold underline">
                {selectedListStatus === 'not_found' ? t('insurance.clearFilter') : t('insurance.clickToFilter')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Monthly Social Contributions Total */}
        <Card className="border-l-4 border-l-brand-500 bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B] shadow-sm transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider block">
                {t('insurance.kpiMonthlyBill')}
              </span>
              <span className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-1 block font-mono">
                {(stats.totalContributions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('insurance.currency')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {t('insurance.kpiMonthlyBillSub')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation Matching Excel Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1E293B] pb-0 transition-colors">
        <button
          type="button"
          onClick={() => setActiveTab('social_insurance')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs border-b-2 transition-all ${
            activeTab === 'social_insurance'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/30 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('insurance.tabSocialInsurance')}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            {stats.totalInsuredRows}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('missing_documents')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs border-b-2 transition-all ${
            activeTab === 'missing_documents'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/30 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>{t('insurance.tabMissingDocs')}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-bold">
            {stats.incompleteDocsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs border-b-2 transition-all ${
            activeTab === 'reconciliation'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/30 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('insurance.tabReconciliation')}</span>
          {stats.notFoundCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold animate-pulse">
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
            searchPlaceholder={t('insurance.searchSocialPlaceholder')}
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
                  {t('insurance.selectAllSocial')} ({socialRecords.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleExportSelectedSocial}
                >
                  {t('insurance.exportSelected')} ({ids.length})
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
                    ? t('insurance.deleteAllSocial')
                    : t('insurance.deleteSelectedSocial', { count: ids.length })}
                </Button>
                <Button variant="ghost" size="sm" onClick={clear}>
                  {t('insurance.clearSelection')}
                </Button>
              </div>
            )}
            filtersSlot={
              <div className="flex flex-wrap items-center gap-2">
                <label
                  title={isAllSocialSelected ? t('insurance.clearSelection') : t('insurance.selectAllSocial')}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all shadow-sm select-none',
                    isAllSocialSelected
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-400 dark:border-brand-700 text-brand-800 dark:text-brand-300 ring-1 ring-brand-300 dark:ring-brand-700'
                      : isSomeSocialSelected
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                      : 'bg-white dark:bg-[#151D2E] border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isAllSocialSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomeSocialSelected && !isAllSocialSelected;
                    }}
                    onChange={handleToggleSelectAllSocial}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer accent-brand-600"
                  />
                  <span className="whitespace-nowrap">
                    {isAllSocialSelected
                      ? t('insurance.allSocialSelectedCount', { count: socialRecords.length })
                      : isSomeSocialSelected
                      ? t('insurance.selectedCountOf', { selected: selectedSocialIds.length, total: socialRecords.length })
                      : t('insurance.selectAllSocialCount', { count: socialRecords.length })}
                  </span>
                </label>

                {/* Department filter */}
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 [&>option]:bg-white [&>option]:dark:bg-[#151D2E] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer transition-colors"
                >
                  <option value="all">{t('insurance.allDepts')}</option>
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
                  className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 [&>option]:bg-white [&>option]:dark:bg-[#151D2E] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-semibold transition-colors"
                >
                  <option value="all">{t('insurance.allMatchStatus')}</option>
                  <option value="found">{t('insurance.filterFound')}</option>
                  <option value="not_found">{t('insurance.filterNotFound')}</option>
                </select>

                {socialRecords.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsDeleteAllSocialModalOpen(true)}
                    className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/50"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  >
                    {t('insurance.deleteAllSocial')}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openImporter('social_insurance')}
                  leftIcon={<Upload className="w-3 h-3" />}
                >
                  {t('insurance.importSocialBtn')}
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
            searchPlaceholder={t('insurance.searchMissingPlaceholder')}
            exportFilename={
              selectedDocStatusFilter === 'complete'
                ? 'Complete_Documents_Audit_List'
                : selectedDocStatusFilter === 'incomplete'
                ? 'Incomplete_Documents_Audit_List'
                : 'All_Documents_Audit_List'
            }
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
                  {selectedDocStatusFilter === 'complete'
                    ? t('insurance.selectAllComplete')
                    : selectedDocStatusFilter === 'all'
                    ? t('insurance.selectAllRecordsCount', { count: missingRecords.length })
                    : t('insurance.selectAllMissing')} ({missingRecords.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleExportSelectedMissing}
                >
                  {t('insurance.exportSelected')} ({ids.length})
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
                    ? t('insurance.deleteAllMissing')
                    : t('insurance.deleteSelectedMissing', { count: ids.length })}
                </Button>
                <Button variant="ghost" size="sm" onClick={clear}>
                  {t('insurance.clearSelection')}
                </Button>
              </div>
            )}
            filtersSlot={
              <div className="flex flex-wrap items-center gap-2">
                <label
                  title={isAllMissingSelected ? t('insurance.clearSelection') : t('insurance.selectAllMissing')}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all shadow-sm select-none',
                    isAllMissingSelected
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-400 dark:border-brand-700 text-brand-800 dark:text-brand-300 ring-1 ring-brand-300 dark:ring-brand-700'
                      : isSomeMissingSelected
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                      : 'bg-white dark:bg-[#151D2E] border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isAllMissingSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomeMissingSelected && !isAllMissingSelected;
                    }}
                    onChange={handleToggleSelectAllMissing}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer accent-brand-600"
                  />
                  <span className="whitespace-nowrap">
                    {isAllMissingSelected
                      ? t('insurance.allMissingSelectedCount', { count: missingRecords.length })
                      : isSomeMissingSelected
                      ? t('insurance.selectedCountOf', { selected: selectedMissingIds.length, total: missingRecords.length })
                      : selectedDocStatusFilter === 'complete'
                      ? t('insurance.selectAllCompleteCount', { count: missingRecords.length })
                      : selectedDocStatusFilter === 'all'
                      ? t('insurance.selectAllRecordsCount', { count: missingRecords.length })
                      : t('insurance.selectAllMissingCount', { count: missingRecords.length })}
                  </span>
                </label>

                {/* Status Segmented Pills */}
                <div className="inline-flex items-center rounded-lg border border-slate-300 dark:border-[#1E293B] bg-slate-100/80 dark:bg-[#0B0F19] p-0.5 text-xs font-semibold shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocStatusFilter('all');
                      setSelectedMissingIds([]);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5',
                      selectedDocStatusFilter === 'all'
                        ? 'bg-white dark:bg-[#151D2E] text-slate-900 dark:text-white shadow-sm font-bold ring-1 ring-slate-200 dark:ring-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <span>{t('insurance.filterAllRecords')}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      {stats.totalMissingDocs || 199}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocStatusFilter('complete');
                      setSelectedDocFilter('all');
                      setSelectedMissingIds([]);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5',
                      selectedDocStatusFilter === 'complete'
                        ? 'bg-emerald-600 text-white shadow-sm font-bold ring-1 ring-emerald-500'
                        : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300'
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('insurance.filterStatusComplete')}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono',
                        selectedDocStatusFilter === 'complete'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      )}
                    >
                      {stats.completeDocsCount || 15}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocStatusFilter('incomplete');
                      setSelectedMissingIds([]);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5',
                      selectedDocStatusFilter === 'incomplete'
                        ? 'bg-rose-600 text-white shadow-sm font-bold ring-1 ring-rose-500'
                        : 'text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300'
                    )}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t('insurance.filterStatusIncomplete')}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono',
                        selectedDocStatusFilter === 'incomplete'
                          ? 'bg-rose-700 text-white'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      )}
                    >
                      {stats.incompleteDocsCount || 184}
                    </span>
                  </button>
                </div>

                {/* Specific Missing Document Dropdown */}
                <select
                  value={selectedDocFilter}
                  onChange={e => setSelectedDocFilter(e.target.value)}
                  disabled={selectedDocStatusFilter === 'complete'}
                  className={cn(
                    'text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 [&>option]:bg-white [&>option]:dark:bg-[#151D2E] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-semibold transition-colors',
                    selectedDocStatusFilter === 'complete' && 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                  )}
                  title={selectedDocStatusFilter === 'complete' ? t('insurance.missingDocDisabledHint') : undefined}
                >
                  <option value="all">{t('insurance.filterAllMissing')}</option>
                  <option value="qualification">{t('insurance.filterMissingQual')}</option>
                  <option value="birth">{t('insurance.filterMissingBirth')}</option>
                  <option value="idCard">{t('insurance.filterMissingId')}</option>
                  <option value="contract">{t('insurance.filterMissingContract')}</option>
                </select>

                {/* Department filter */}
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 [&>option]:bg-white [&>option]:dark:bg-[#151D2E] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer transition-colors font-medium"
                >
                  <option value="all">{t('insurance.allDepts')}</option>
                  <option value="HR">HR</option>
                  <option value="PD-fish">PD-fish</option>
                  <option value="Pd-poultry">Pd-poultry</option>
                  <option value="QC">QC</option>
                  <option value="FD">FD</option>
                  <option value="PUD">PUD</option>
                  <option value="SD-fish">SD-fish</option>
                  <option value="SD-poultry">SD-poultry</option>
                </select>

                {missingRecords.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsDeleteAllMissingModalOpen(true)}
                    className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/50"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  >
                    {t('insurance.deleteAllMissing')}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openImporter('missing_documents')}
                  leftIcon={<Upload className="w-3 h-3" />}
                >
                  {t('insurance.importMissingBtn')}
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
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                    {t('insurance.reconcileDiscrepancyTitle')}
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
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
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                    {t('insurance.reconcileCleanTitle')}
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    {t('insurance.reconcileCleanDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 bg-white dark:bg-[#151D2E] space-y-3 transition-colors">
              <h4 className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t('insurance.matchedEmployeesTitle', { count: stats.insuredCount })}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('insurance.matchedEmployeesDesc')}
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300 font-mono">
                {t('insurance.totalMonthlyInsuranceWage', { amount: stats.totalSalary.toLocaleString('en-US', { minimumFractionDigits: 2 }) })}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 bg-white dark:bg-[#151D2E] space-y-3 transition-colors">
              <h4 className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                {t('insurance.uninsuredEmployeesTitle', { count: stats.notInsuredCount })}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('insurance.uninsuredEmployeesDesc')}
              </p>
              <div className="bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3 text-xs text-rose-800 dark:text-rose-300 font-mono">
                {t('insurance.readyForInsuranceHint')}
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
        title={t('insurance.confirmDeleteAllSocialTitle')}
        message={t('insurance.confirmDeleteAllSocialMessage', { count: socialRecords.length })}
        confirmLabel={t('insurance.confirmDeleteAllSocialButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Bulk Delete Social Insurance Records Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteSocialModalOpen}
        onClose={() => setIsBulkDeleteSocialModalOpen(false)}
        onConfirm={handleConfirmBulkDeleteSocial}
        title={t('insurance.confirmBulkDeleteSocialTitle')}
        message={t('insurance.confirmBulkDeleteSocialMessage', { count: selectedSocialIds.length })}
        confirmLabel={t('insurance.confirmBulkDeleteSocialButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Single Delete Social Insurance Record Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingSocialRecord}
        onClose={() => setDeletingSocialRecord(null)}
        onConfirm={handleConfirmSingleDeleteSocial}
        title={t('insurance.confirmSingleDeleteSocialTitle')}
        message={t('insurance.confirmSingleDeleteSocialMessage', { name: deletingSocialRecord?.employeeName })}
        confirmLabel={t('insurance.confirmSingleDeleteSocialButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Delete All Missing Documents Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllMissingModalOpen}
        onClose={() => setIsDeleteAllMissingModalOpen(false)}
        onConfirm={handleConfirmDeleteAllMissing}
        title={t('insurance.confirmDeleteAllMissingTitle')}
        message={t('insurance.confirmDeleteAllMissingMessage', { count: missingRecords.length })}
        confirmLabel={t('insurance.confirmDeleteAllMissingButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Bulk Delete Missing Documents Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteMissingModalOpen}
        onClose={() => setIsBulkDeleteMissingModalOpen(false)}
        onConfirm={handleConfirmBulkDeleteMissing}
        title={t('insurance.confirmBulkDeleteMissingTitle')}
        message={t('insurance.confirmBulkDeleteMissingMessage', { count: selectedMissingIds.length })}
        confirmLabel={t('insurance.confirmBulkDeleteMissingButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Single Delete Missing Document Record Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingMissingRecord}
        onClose={() => setDeletingMissingRecord(null)}
        onConfirm={handleConfirmSingleDeleteMissing}
        title={t('insurance.confirmSingleDeleteMissingTitle')}
        message={t('insurance.confirmSingleDeleteMissingMessage', { name: deletingMissingRecord?.employeeName })}
        confirmLabel={t('insurance.confirmSingleDeleteMissingButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Insurance Form 1 Guide Modal */}
      <InsuranceForm1GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => {
          setIsGuideModalOpen(false);
          setSelectedGuideRecord(null);
        }}
        insuranceRecord={selectedGuideRecord}
      />
    </div>
  );
};
