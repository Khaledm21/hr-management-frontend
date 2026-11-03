import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Printer,
  Download,
  X,
  SlidersHorizontal,
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  FileText,
  Check,
  Users,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { SocialInsuranceRecord, MissingDocumentRecord } from '../../../types';
import newHopeLogo from '../../../assets/new-hope-logo.png';
import { cn } from '../../../lib/utils';
import * as XLSX from 'xlsx';

export type InsurancePrintTab = 'missing_documents' | 'social_insurance' | 'reconciliation';

interface InsurancePrintTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: InsurancePrintTab;
  missingRecords: MissingDocumentRecord[];
  socialRecords: SocialInsuranceRecord[];
  allSocialRecords?: SocialInsuranceRecord[];
  initialSelectedMissingIds?: string[];
  initialSelectedSocialIds?: string[];
  departmentFilter?: string;
  missingDocFilter?: string;
  docStatusFilter?: 'all' | 'complete' | 'incomplete';
  insuranceFilter?: 'all' | 'insured' | 'not_insured';
  initialListStatusFilter?: 'all' | 'found' | 'not_found';
}

interface ColumnOption {
  id: string;
  label: string;
  visible: boolean;
  width: string;
}

export const InsurancePrintTableModal: React.FC<InsurancePrintTableModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'missing_documents',
  missingRecords,
  socialRecords,
  allSocialRecords = [],
  initialSelectedMissingIds = [],
  initialSelectedSocialIds = [],
  departmentFilter = 'all',
  missingDocFilter = 'all',
  docStatusFilter = 'all',
  insuranceFilter = 'all',
  initialListStatusFilter = 'all',
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const isZh = i18n.language === 'zh-CN';

  // Active print report type
  const [activeTab, setActiveTab] = useState<InsurancePrintTab>(defaultTab);

  // Scope: all or selected
  const [dataScope, setDataScope] = useState<'all' | 'selected'>(() => {
    if (defaultTab === 'social_insurance' && initialSelectedSocialIds.length > 0) return 'selected';
    if (defaultTab === 'missing_documents' && initialSelectedMissingIds.length > 0) return 'selected';
    return 'all';
  });

  // Master Social Pool (prefer allSocialRecords if provided, fallback to socialRecords)
  const masterSocialPool = useMemo(() => {
    if (allSocialRecords && allSocialRecords.length > 0) return allSocialRecords;
    return socialRecords;
  }, [allSocialRecords, socialRecords]);

  // Local Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>(departmentFilter || 'all');
  const [selectedDocStatus, setSelectedDocStatus] = useState<string>(docStatusFilter || 'all');
  const [selectedInsFilter, setSelectedInsFilter] = useState<string>(insuranceFilter || 'all');
  const [selectedListStatusFilter, setSelectedListStatusFilter] = useState<'all' | 'found' | 'not_found'>(
    initialListStatusFilter || 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Toggles
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Helper: check if a missing doc row is insured in social records
  const isRowInsured = (row: MissingDocumentRecord) => {
    if (row.insuranceStatus === 'insured') return true;
    return socialRecords.some(
      s =>
        (row.nationalId && s.nationalId && s.nationalId.trim() === row.nationalId.trim()) ||
        (row.employeeCode && s.employeeCode && s.employeeCode.trim() === row.employeeCode.trim())
    );
  };

  // Distinct departments
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    missingRecords.forEach(r => r.department && set.add(r.department.trim()));
    socialRecords.forEach(r => r.department && set.add(r.department.trim()));
    return Array.from(set).sort();
  }, [missingRecords, socialRecords]);

  // Column definitions for Tab 1: Missing Documents
  const [missingCols, setMissingCols] = useState<ColumnOption[]>([
    { id: 'seq', label: '#', visible: true, width: '3%' },
    { id: 'employeeCode', label: 'كود الموظف', visible: true, width: '8%' },
    { id: 'employeeName', label: 'اسم الموظف', visible: true, width: '18%' },
    { id: 'nationalId', label: 'الرقم القومي', visible: true, width: '12%' },
    { id: 'department', label: 'القسم', visible: true, width: '8%' },
    { id: 'position', label: 'المسمى الوظيفي', visible: true, width: '11%' },
    { id: 'startDate', label: 'تاريخ التعيين', visible: true, width: '7%' },
    { id: 'insuranceStatus', label: 'الموقف التأميني', visible: true, width: '8%' },
    { id: 'qualificationCert', label: 'أصل المؤهل', visible: true, width: '6.5%' },
    { id: 'birthCert', label: 'شهادة الميلاد', visible: true, width: '6.5%' },
    { id: 'idCard', label: 'صورة البطاقة', visible: true, width: '6.5%' },
    { id: 'contract', label: 'عقد العمل', visible: true, width: '6.5%' },
    { id: 'status', label: 'حالة الملف', visible: true, width: '6%' },
  ]);

  // Column definitions for Tab 2: Social Insurance
  const [socialCols, setSocialCols] = useState<ColumnOption[]>([
    { id: 'seq', label: '#', visible: true, width: '3%' },
    { id: 'nationalId', label: 'الرقم القومي', visible: true, width: '13%' },
    { id: 'employeeName', label: 'اسم الموظف', visible: true, width: '17%' },
    { id: 'employeeCode', label: 'الكود', visible: true, width: '7%' },
    { id: 'department', label: 'القسم', visible: true, width: '7.5%' },
    { id: 'insuranceNumber', label: 'الرقم التأميني', visible: true, width: '10%' },
    { id: 'insuranceSalary', label: 'أجر الاشتراك (ج.م)', visible: true, width: '10%' },
    { id: 'workerShare', label: 'حصة العامل (11%)', visible: true, width: '8.5%' },
    { id: 'companyShare', label: 'حصة الشركة (18.75%)', visible: true, width: '9%' },
    { id: 'totalContribution', label: 'إجمالي الاشتراك', visible: true, width: '8%' },
    { id: 'employeeListStatus', label: 'المطابقة بالشيت', visible: true, width: '10%' },
  ]);

  // Reactive localized column labels
  const getColLabel = useCallback(
    (id: string) => {
      switch (id) {
        case 'seq':
          return t('insurance.colSeq');
        case 'employeeCode':
          return t('insurance.colEmpCode');
        case 'employeeName':
          return t('insurance.colEmpName');
        case 'nationalId':
          return t('insurance.colNID');
        case 'department':
          return t('insurance.colDept');
        case 'position':
          return t('insurance.colJob');
        case 'startDate':
          return t('insurance.colHireDate');
        case 'insuranceStatus':
          return t('insurance.colInsStatus');
        case 'qualificationCert':
          return t('insurance.colQualCert');
        case 'birthCert':
          return t('insurance.colBirthCert');
        case 'idCard':
          return t('insurance.colIDCard');
        case 'contract':
          return t('insurance.colContract');
        case 'status':
          return t('insurance.colFileStatus');
        case 'insuranceNumber':
          return t('insurance.colInsNo');
        case 'insuranceSalary':
          return t('insurance.colInsSalary');
        case 'workerShare':
          return t('insurance.colWorkerShare');
        case 'companyShare':
          return t('insurance.colCompanyShare');
        case 'totalContribution':
          return t('insurance.colTotalContribution');
        case 'employeeListStatus':
          return t('insurance.colSheetMatch');
        default:
          return id;
      }
    },
    [t]
  );

  // Active columns based on selected report
  const activeColumns = activeTab === 'missing_documents' ? missingCols : socialCols;

  const toggleColumn = (id: string) => {
    if (activeTab === 'missing_documents') {
      setMissingCols(prev => prev.map(c => (c.id === id ? { ...c, visible: !c.visible } : c)));
    } else {
      setSocialCols(prev => prev.map(c => (c.id === id ? { ...c, visible: !c.visible } : c)));
    }
  };

  const isColVisible = (id: string) => activeColumns.find(c => c.id === id)?.visible ?? false;
  const getColWidth = (id: string) => activeColumns.find(c => c.id === id)?.width || 'auto';

  // Filtered Missing Records
  const displayedMissing = useMemo(() => {
    let list = missingRecords;
    if (dataScope === 'selected' && initialSelectedMissingIds.length > 0) {
      list = list.filter(r => initialSelectedMissingIds.includes(r.id));
    }
    if (selectedDeptFilter !== 'all') {
      list = list.filter(r => r.department === selectedDeptFilter);
    }
    if (selectedDocStatus !== 'all') {
      list = list.filter(r => r.status === selectedDocStatus);
    }
    if (selectedInsFilter !== 'all') {
      list = list.filter(r => {
        const ins = isRowInsured(r);
        return selectedInsFilter === 'insured' ? ins : !ins;
      });
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r =>
        (r.employeeName || '').toLowerCase().includes(q) ||
        (r.nationalId || '').includes(q) ||
        (r.employeeCode || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q) ||
        (r.position || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [missingRecords, dataScope, initialSelectedMissingIds, selectedDeptFilter, selectedDocStatus, selectedInsFilter, searchTerm]);

  // Filtered Social Records
  const displayedSocial = useMemo(() => {
    let list = masterSocialPool;
    if (dataScope === 'selected' && initialSelectedSocialIds.length > 0) {
      list = list.filter(r => initialSelectedSocialIds.includes(r.id));
    }
    if (selectedDeptFilter !== 'all') {
      list = list.filter(r => r.department === selectedDeptFilter);
    }
    if (selectedListStatusFilter !== 'all') {
      list = list.filter(r => r.employeeListStatus === selectedListStatusFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r =>
        (r.employeeName || '').toLowerCase().includes(q) ||
        (r.nationalId || '').includes(q) ||
        (r.employeeCode || '').toLowerCase().includes(q) ||
        (r.insuranceNumber || '').includes(q) ||
        (r.department || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [masterSocialPool, dataScope, initialSelectedSocialIds, selectedDeptFilter, selectedListStatusFilter, searchTerm]);

  // Missing Docs Stats
  const missingStats = useMemo(() => {
    const total = displayedMissing.length;
    const complete = displayedMissing.filter(r => r.status === 'complete').length;
    const incomplete = displayedMissing.filter(r => r.status === 'incomplete').length;
    const insured = displayedMissing.filter(r => isRowInsured(r)).length;
    const notInsured = total - insured;
    const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;
    return { total, complete, incomplete, insured, notInsured, completionRate };
  }, [displayedMissing]);

  // Social Stats with Found / Not Found distinction
  const socialStats = useMemo(() => {
    const total = displayedSocial.length;
    const foundCount = displayedSocial.filter(r => r.employeeListStatus === 'found').length;
    const notFoundCount = displayedSocial.filter(r => r.employeeListStatus === 'not_found').length;
    const totalSalary = displayedSocial.reduce((sum, r) => sum + (Number(r.insuranceSalary) || 0), 0);
    const totalWorker = displayedSocial.reduce((sum, r) => sum + (Number(r.workerShare) || 0), 0);
    const totalCompany = displayedSocial.reduce((sum, r) => sum + (Number(r.companyShare) || 0), 0);
    const totalContrib = totalWorker + totalCompany;
    return { total, foundCount, notFoundCount, totalSalary, totalWorker, totalCompany, totalContrib };
  }, [displayedSocial]);

  const getSocialReportTitle = () => {
    if (selectedListStatusFilter === 'not_found') {
      return t('insurance.printTitleSocialDiscrepancy');
    }
    if (selectedListStatusFilter === 'found') {
      return t('insurance.printTitleSocialMatched');
    }
    return t('insurance.printTitleSocialComprehensive');
  };

  const getMissingReportTitle = () => {
    return t('insurance.printTitleMissingDocs');
  };

  const printDate = useMemo(() => {
    return new Date().toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }, [isRtl]);

  // Print via isolated iframe
  const handlePrint = () => {
    const reportElem = document.getElementById('insurance-printable-report');
    if (!reportElem) {
      window.print();
      return;
    }

    const oldIframe = document.getElementById('insurance-print-frame');
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'insurance-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '297mm';
    iframe.style.height = '210mm';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${isRtl ? 'ar' : 'en'}">
      <head>
        <meta charset="utf-8" />
        <base href="${window.location.origin}/" />
        <title>${activeTab === 'missing_documents' ? getMissingReportTitle() : getSocialReportTitle()}</title>
        ${styles}
        <style>
          @page {
            size: A4 landscape;
            margin: 6mm 8mm;
          }
          @media print {
            @page {
              size: A4 landscape;
              margin: 6mm 8mm;
            }
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          table, tbody {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            table-layout: fixed !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-row-group !important;
          }
          th {
            background-color: #0f172a !important;
            color: #ffffff !important;
            font-weight: 700 !important;
            border: 1px solid #1e293b !important;
            padding: 4px 2px !important;
            text-align: center !important;
            font-size: 9px !important;
          }
          td {
            border: 1px solid #cbd5e1 !important;
            padding: 3px 2px !important;
            font-size: 8.5px !important;
            text-align: center !important;
            line-height: 1.15 !important;
          }
          img {
            max-height: 40px !important;
            width: auto !important;
            object-fit: contain !important;
          }
          .sign-box {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        ${reportElem.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Print iframe error:', e);
        window.print();
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }
    };

    const images = Array.from(doc.images || []);
    if (images.length === 0) {
      setTimeout(triggerPrint, 250);
    } else {
      Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      ).then(() => {
        setTimeout(triggerPrint, 250);
      });
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    if (activeTab === 'missing_documents') {
      const rows = displayedMissing.map((r, i) => ({
        '#': i + 1,
        'كود الموظف': r.employeeCode || '',
        'اسم الموظف': r.employeeName,
        'الرقم القومي': r.nationalId,
        'القسم': r.department,
        'المسمى الوظيفي': r.position,
        'تاريخ التعيين': r.startDate || '',
        'الموقف التأميني': isRowInsured(r) ? 'مؤمن عليه' : 'غير مؤمن',
        'شهادة المؤهل': r.qualificationCert === 'available' ? 'مستوفاة' : 'ناقصة',
        'شهادة الميلاد': r.birthCert === 'available' ? 'مستوفاة' : 'ناقصة',
        'صورة البطاقة': r.idCard === 'available' ? 'مستوفاة' : 'ناقصة',
        'عقد العمل': r.contract === 'available' ? 'مستوفاة' : 'ناقصة',
        'حالة الملف': r.status === 'complete' ? 'مكتمل' : 'ناقص',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'اكتمال الملفات');
      XLSX.writeFile(wb, 'كشف_استيفاء_مسوغات_التعيين.xlsx');
    } else {
      const rows = displayedSocial.map((r, i) => ({
        '#': i + 1,
        'الرقم القومي': r.nationalId,
        'اسم الموظف': r.employeeName,
        'الكود': r.employeeCode || '',
        'القسم': r.department,
        'الرقم التأميني': r.insuranceNumber,
        'أجر الاشتراك': r.insuranceSalary,
        'حصة العامل (11%)': r.workerShare,
        'حصة المنشأة (18.75%)': r.companyShare,
        'إجمالي الاشتراك': r.workerShare + r.companyShare,
        'المطابقة بشيت الموظفين': r.employeeListStatus === 'found' ? 'مسجل بشيت الموظفين' : 'غير مسجل بشيت الموظفين (فرق مطابقة)',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'التأمينات الاجتماعية');
      const filename = selectedListStatusFilter === 'not_found'
        ? 'كشف_فروق_التأمينات_غير_المسجلين_بشيت_الموظفين.xlsx'
        : selectedListStatusFilter === 'found'
        ? 'كشف_التأمينات_المطابقون_بشيت_الموظفين.xlsx'
        : 'كشف_التأمينات_الاجتماعية_الشامل.xlsx';
      XLSX.writeFile(wb, filename);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={t('insurance.printModalTitle')}
      description={t('insurance.printModalSubtitle')}
    >
      <div className="space-y-4 text-xs">
        {/* Top Controls Toolbar */}
        <div className="p-3 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          {/* Report Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#151D2E] rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('missing_documents')}
                className={cn(
                  'px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer',
                  activeTab === 'missing_documents'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{t('insurance.tabPrintMissingDocs')}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {missingRecords.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('social_insurance')}
                className={cn(
                  'px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer',
                  activeTab === 'social_insurance'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {selectedListStatusFilter === 'not_found'
                    ? t('insurance.tabPrintSocialNotFound')
                    : selectedListStatusFilter === 'found'
                    ? t('insurance.tabPrintSocialFound')
                    : t('insurance.tabPrintSocialIns')}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {displayedSocial.length}
                </span>
              </button>
            </div>

            {/* Print & Export Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                onClick={handleExportExcel}
                className="font-bold text-xs"
              >
                {t('insurance.exportExcelBtn')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-3.5 h-3.5" />}
                onClick={handlePrint}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm px-4"
              >
                {t('insurance.printNowBtn')}
              </Button>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {/* Scope */}
            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">{t('insurance.printScopeLabel')}</label>
              <select
                value={dataScope}
                onChange={e => setDataScope(e.target.value as any)}
                className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 bg-white dark:bg-[#151D2E] text-slate-800 dark:text-slate-200"
              >
                <option value="all">
                  {t('insurance.printScopeAll', { count: activeTab === 'missing_documents' ? missingRecords.length : displayedSocial.length })}
                </option>
                <option value="selected">
                  {t('insurance.printScopeSelected', { count: activeTab === 'missing_documents' ? initialSelectedMissingIds.length : initialSelectedSocialIds.length })}
                </option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">{t('insurance.printDeptLabel')}</label>
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 bg-white dark:bg-[#151D2E] text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="all">{t('insurance.printAllDepts')}</option>
                {departmentsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Social List Match Status Filter (Only for Social Insurance) */}
            {activeTab === 'social_insurance' && (
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-brand-700 dark:text-brand-400 block mb-0.5">
                  {t('insurance.printMatchStatusLabel')}
                </label>
                <select
                  value={selectedListStatusFilter}
                  onChange={e => setSelectedListStatusFilter(e.target.value as any)}
                  className="w-full text-xs border border-brand-300 dark:border-brand-700 rounded-lg p-1.5 bg-white dark:bg-[#151D2E] text-slate-900 dark:text-slate-100 font-black cursor-pointer shadow-xs"
                >
                  <option value="all">{t('insurance.printMatchAll', { count: masterSocialPool.length })}</option>
                  <option value="found">{t('insurance.printMatchFound', { count: masterSocialPool.filter(r => r.employeeListStatus === 'found').length })}</option>
                  <option value="not_found">{t('insurance.printMatchNotFound', { count: masterSocialPool.filter(r => r.employeeListStatus === 'not_found').length })}</option>
                </select>
              </div>
            )}

            {/* File Completeness Status (Only for Missing Docs) */}
            {activeTab === 'missing_documents' && (
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">{t('insurance.printDocStatusLabel')}</label>
                <select
                  value={selectedDocStatus}
                  onChange={e => setSelectedDocStatus(e.target.value)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 bg-white dark:bg-[#151D2E] text-slate-800 dark:text-slate-200"
                >
                  <option value="all">{t('insurance.printDocStatusAll')}</option>
                  <option value="complete">{t('insurance.printDocStatusComplete')}</option>
                  <option value="incomplete">{t('insurance.printDocStatusIncomplete')}</option>
                </select>
              </div>
            )}

            {/* Insurance Filter (Only for Missing Docs) */}
            {activeTab === 'missing_documents' && (
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">{t('insurance.printInsStatusLabel')}</label>
                <select
                  value={selectedInsFilter}
                  onChange={e => setSelectedInsFilter(e.target.value)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 bg-white dark:bg-[#151D2E] text-slate-800 dark:text-slate-200"
                >
                  <option value="all">{t('insurance.printInsStatusAll')}</option>
                  <option value="insured">{t('insurance.printInsStatusInsured')}</option>
                  <option value="not_insured">{t('insurance.printInsStatusNotInsured')}</option>
                </select>
              </div>
            )}

            {/* Quick Search */}
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">{t('insurance.printQuickSearchLabel')}</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder={t('insurance.printQuickSearchPlaceholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg pr-8 pl-2 py-1.5 bg-white dark:bg-[#151D2E] text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Toggle Options: Header, Stats, Signatures, Columns */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={e => setIncludeHeader(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>{t('insurance.toggleHeader')}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={e => setIncludeStats(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>{t('insurance.toggleStats')}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={e => setIncludeSignatures(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>{t('insurance.toggleSignatures')}</span>
              </label>
            </div>

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<SlidersHorizontal className="w-3 h-3 text-brand-500" />}
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="text-[11px] h-7"
            >
              <span>{t('insurance.customizeColumnsBtn', { count: activeColumns.filter(c => c.visible).length })}</span>
            </Button>
          </div>

          {/* Column Visibility Picker Drawer */}
          {showColumnPicker && (
            <div className="p-3 bg-white dark:bg-[#151D2E] border border-slate-200 dark:border-slate-700 rounded-lg mt-2">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-2">
                {t('insurance.columnPickerTitle')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {activeColumns.map(col => (
                  <label
                    key={col.id}
                    className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => toggleColumn(col.id)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span className="truncate">{getColLabel(col.id)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LIVE PRINT PREVIEW CONTAINER */}
        <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner bg-slate-200/60 dark:bg-slate-900/80 p-2 sm:p-4 max-h-[58vh] overflow-y-auto">
          <div
            id="insurance-printable-report"
            className="bg-white text-slate-900 p-5 sm:p-6 rounded-lg shadow-md mx-auto max-w-[1100px]"
            style={{ width: '100%', minHeight: 'auto' }}
          >
            {/* Header with New Hope Logo */}
            {includeHeader && (
              <div className="border-b-2 border-slate-900 pb-3 mb-3" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div className="flex items-center justify-between">
                  {/* Left (English & Chinese) */}
                  <div className="text-left space-y-0.5">
                    <h2 className="text-xs font-black text-slate-900 tracking-wide uppercase">
                      NEW HOPE EGYPT AQUATIC TECHNOLOGY CO., LTD
                    </h2>
                    <p className="text-[10px] font-bold text-emerald-800 tracking-widest">
                      新希望六和 (New Hope Gamasa)
                    </p>
                    <p className="text-[9px] text-slate-600">
                      Gamasa Factory • Dakahlia • Human Resources Department
                    </p>
                  </div>

                  {/* Logo Center */}
                  <div className="flex flex-col items-center">
                    {!imgError ? (
                      <img
                        src={newHopeLogo}
                        alt="New Hope"
                        onError={() => setImgError(true)}
                        className="h-11 object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                        NH
                      </div>
                    )}
                  </div>

                  {/* Right (Arabic) */}
                  <div className="text-right space-y-0.5">
                    <h2 className="text-xs font-black text-slate-900">
                      شركة نيو هوب إيجيبت أكواتك تكنولوجي المحدودة
                    </h2>
                    <p className="text-[10px] font-bold text-slate-800">
                      مصنع مدينة جمصة - المنطقة الصناعية - محافظة الدقهلية
                    </p>
                    <p className="text-[9px] text-slate-600 font-medium">
                      إدارة الموارد البشرية والشؤون الإدارية - قسم التأمينات وشؤون العاملين
                    </p>
                  </div>
                </div>

                {/* Report Title & Metadata Badge */}
                <div className="mt-2.5 pt-2 border-t border-slate-300 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'font-black text-sm px-3 py-1 rounded border',
                        activeTab === 'social_insurance' && selectedListStatusFilter === 'not_found'
                          ? 'bg-rose-50 text-rose-950 border-rose-300'
                          : activeTab === 'social_insurance' && selectedListStatusFilter === 'found'
                          ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                          : 'bg-slate-100 text-slate-900 border-slate-300'
                      )}
                    >
                      {activeTab === 'missing_documents'
                        ? getMissingReportTitle()
                        : getSocialReportTitle()}
                    </span>

                    {selectedDeptFilter !== 'all' && (
                      <span className="bg-brand-50 border border-brand-300 text-brand-900 px-2 py-0.5 rounded font-bold text-[10px]">
                        {t('insurance.printDeptLabel')}: {selectedDeptFilter}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-600 font-medium font-mono">
                    <span>{t('insurance.printDateLabel')} <strong>{printDate}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Bar */}
            {includeStats && (
              <div
                className="grid grid-cols-4 gap-2 mb-3 text-center"
                style={{ pageBreakInside: 'avoid' }}
              >
                {activeTab === 'missing_documents' ? (
                  <>
                    <div className="border border-slate-300 rounded p-1.5 bg-slate-50">
                      <div className="text-[9px] font-bold text-slate-600">{t('insurance.kpiTotalEmployees', 'إجمالي المؤمن عليهم')}</div>
                      <div className="text-sm font-black text-slate-900">{missingStats.total}</div>
                    </div>
                    <div className="border border-emerald-300 rounded p-1.5 bg-emerald-50">
                      <div className="text-[9px] font-bold text-emerald-800">{t('insurance.kpiCompleteFiles', 'ملفات مكتملة')}</div>
                      <div className="text-sm font-black text-emerald-900">
                        {missingStats.complete} ({missingStats.completionRate}%)
                      </div>
                    </div>
                    <div className="border border-rose-300 rounded p-1.5 bg-rose-50">
                      <div className="text-[9px] font-bold text-rose-800">{t('insurance.kpiIncompleteFiles', 'ملفات ناقصة')}</div>
                      <div className="text-sm font-black text-rose-900">{missingStats.incomplete}</div>
                    </div>
                    <div className="border border-blue-300 rounded p-1.5 bg-blue-50">
                      <div className="text-[9px] font-bold text-blue-800">{t('insurance.kpiInsuredCount', 'مؤمن عليهم')}</div>
                      <div className="text-sm font-black text-blue-900">{missingStats.insured}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className={cn(
                        'border rounded p-1.5',
                        selectedListStatusFilter === 'not_found'
                          ? 'border-rose-300 bg-rose-50'
                          : selectedListStatusFilter === 'found'
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-300 bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'text-[9px] font-bold',
                          selectedListStatusFilter === 'not_found'
                            ? 'text-rose-800'
                            : selectedListStatusFilter === 'found'
                            ? 'text-emerald-800'
                            : 'text-slate-600'
                        )}
                      >
                        {selectedListStatusFilter === 'not_found'
                          ? t('insurance.tabPrintSocialNotFound')
                          : selectedListStatusFilter === 'found'
                          ? t('insurance.tabPrintSocialFound')
                          : t('insurance.kpiTotalEmployees', 'إجمالي المؤمن عليهم')}
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {socialStats.total} {t('insurance.employeeUnit')}
                        {selectedListStatusFilter === 'all' && socialStats.notFoundCount > 0 && (
                          <span className="text-[8.5px] font-bold text-slate-500 block">
                            ({socialStats.foundCount} {t('insurance.statusMatched')} • {socialStats.notFoundCount} {t('insurance.statusNotRegistered')})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="border border-blue-300 rounded p-1.5 bg-blue-50">
                      <div className="text-[9px] font-bold text-blue-800">{t('insurance.kpiTotalInsurableWage', 'إجمالي الأجور التأمينية')}</div>
                      <div className="text-sm font-black text-blue-900 font-mono">
                        {socialStats.totalSalary.toLocaleString()} {t('insurance.currency')}
                      </div>
                    </div>
                    <div className="border border-emerald-300 rounded p-1.5 bg-emerald-50">
                      <div className="text-[9px] font-bold text-emerald-800">{t('insurance.kpiWorkerShareTotal', 'حصة العامل (11%)')}</div>
                      <div className="text-sm font-black text-emerald-900 font-mono">
                        {socialStats.totalWorker.toLocaleString()} {t('insurance.currency')}
                      </div>
                    </div>
                    <div className="border border-purple-300 rounded p-1.5 bg-purple-50">
                      <div className="text-[9px] font-bold text-purple-800">{t('insurance.kpiCompanyShareTotal', 'حصة المنشأة (18.75%)')}</div>
                      <div className="text-sm font-black text-purple-900 font-mono">
                        {socialStats.totalCompany.toLocaleString()} {t('insurance.currency')}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* MAIN TABLE */}
            <div className="w-full">
              {activeTab === 'missing_documents' ? (
                displayedMissing.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-lg">
                    لا توجد سجلات مسوغات تعيين مطابقة للخيارات المحددة
                  </div>
                ) : (
                  <table
                    className="w-full border-collapse border border-slate-800 text-[9.5px] leading-tight"
                    style={{ tableLayout: 'fixed', width: '100%' }}
                  >
                    <colgroup>
                      {isColVisible('seq') && <col style={{ width: getColWidth('seq') }} />}
                      {isColVisible('employeeCode') && <col style={{ width: getColWidth('employeeCode') }} />}
                      {isColVisible('employeeName') && <col style={{ width: getColWidth('employeeName') }} />}
                      {isColVisible('nationalId') && <col style={{ width: getColWidth('nationalId') }} />}
                      {isColVisible('department') && <col style={{ width: getColWidth('department') }} />}
                      {isColVisible('position') && <col style={{ width: getColWidth('position') }} />}
                      {isColVisible('startDate') && <col style={{ width: getColWidth('startDate') }} />}
                      {isColVisible('insuranceStatus') && <col style={{ width: getColWidth('insuranceStatus') }} />}
                      {isColVisible('qualificationCert') && <col style={{ width: getColWidth('qualificationCert') }} />}
                      {isColVisible('birthCert') && <col style={{ width: getColWidth('birthCert') }} />}
                      {isColVisible('idCard') && <col style={{ width: getColWidth('idCard') }} />}
                      {isColVisible('contract') && <col style={{ width: getColWidth('contract') }} />}
                      {isColVisible('status') && <col style={{ width: getColWidth('status') }} />}
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold border-b border-slate-900 text-center">
                        {isColVisible('seq') && <th className="border border-slate-700 py-1 px-1">{getColLabel('seq')}</th>}
                        {isColVisible('employeeCode') && <th className="border border-slate-700 py-1 px-1">{getColLabel('employeeCode')}</th>}
                        {isColVisible('employeeName') && <th className="border border-slate-700 py-1 px-1.5 text-right">{getColLabel('employeeName')}</th>}
                        {isColVisible('nationalId') && <th className="border border-slate-700 py-1 px-1">{getColLabel('nationalId')}</th>}
                        {isColVisible('department') && <th className="border border-slate-700 py-1 px-1">{getColLabel('department')}</th>}
                        {isColVisible('position') && <th className="border border-slate-700 py-1 px-1 text-right">{getColLabel('position')}</th>}
                        {isColVisible('startDate') && <th className="border border-slate-700 py-1 px-1">{getColLabel('startDate')}</th>}
                        {isColVisible('insuranceStatus') && <th className="border border-slate-700 py-1 px-1">{getColLabel('insuranceStatus')}</th>}
                        {isColVisible('qualificationCert') && <th className="border border-slate-700 py-1 px-0.5">{getColLabel('qualificationCert')}</th>}
                        {isColVisible('birthCert') && <th className="border border-slate-700 py-1 px-0.5">{getColLabel('birthCert')}</th>}
                        {isColVisible('idCard') && <th className="border border-slate-700 py-1 px-0.5">{getColLabel('idCard')}</th>}
                        {isColVisible('contract') && <th className="border border-slate-700 py-1 px-0.5">{getColLabel('contract')}</th>}
                        {isColVisible('status') && <th className="border border-slate-700 py-1 px-1">{getColLabel('status')}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {displayedMissing.map((row, idx) => {
                        const isEven = idx % 2 === 1;
                        const insured = isRowInsured(row);
                        return (
                          <tr
                            key={row.id}
                            className={cn(isEven ? 'bg-slate-50' : 'bg-white', 'border-b border-slate-300')}
                            style={{ pageBreakInside: 'avoid' }}
                          >
                            {isColVisible('seq') && (
                              <td className="border border-slate-300 text-center py-1 px-0.5 font-mono text-slate-500">
                                {idx + 1}
                              </td>
                            )}
                            {isColVisible('employeeCode') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-mono font-bold text-slate-900">
                                {row.employeeCode || '-'}
                              </td>
                            )}
                            {isColVisible('employeeName') && (
                              <td className="border border-slate-300 py-1 px-1.5 font-bold text-slate-900 text-right">
                                {row.employeeName}
                              </td>
                            )}
                            {isColVisible('nationalId') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-mono text-slate-700">
                                {row.nationalId || '-'}
                              </td>
                            )}
                            {isColVisible('department') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-semibold text-slate-700">
                                {row.department || '-'}
                              </td>
                            )}
                            {isColVisible('position') && (
                              <td className="border border-slate-300 py-1 px-1 text-slate-700 text-right">
                                {row.position || '-'}
                              </td>
                            )}
                            {isColVisible('startDate') && (
                              <td className="border border-slate-300 text-center font-mono text-slate-600 py-1 px-0.5 text-[8.5px]">
                                {row.startDate || '-'}
                              </td>
                            )}
                            {isColVisible('insuranceStatus') && (
                              <td className="border border-slate-300 text-center py-1 px-0.5">
                                <span
                                  className={cn(
                                    'inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold border',
                                    insured
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-300'
                                  )}
                                >
                                  {insured ? t('insurance.statusInsuredBadge') : t('insurance.statusUninsuredBadge')}
                                </span>
                              </td>
                            )}
                            {isColVisible('qualificationCert') && (
                              <td className="border border-slate-300 text-center py-1 px-0.5 font-bold">
                                {row.qualificationCert === 'available' ? (
                                  <span className="text-emerald-700">{t('insurance.statusDocComplete')}</span>
                                ) : (
                                  <span className="text-rose-600">{t('insurance.statusDocMissing')}</span>
                                )}
                              </td>
                            )}
                            {isColVisible('birthCert') && (
                              <td className="border border-slate-300 text-center py-1 px-0.5 font-bold">
                                {row.birthCert === 'available' ? (
                                  <span className="text-emerald-700">{t('insurance.statusDocComplete')}</span>
                                ) : (
                                  <span className="text-rose-600">{t('insurance.statusDocMissing')}</span>
                                )}
                              </td>
                            )}
                            {isColVisible('idCard') && (
                              <td className="border border-slate-300 text-center py-1 px-0.5 font-bold">
                                {row.idCard === 'available' ? (
                                  <span className="text-emerald-700">{t('insurance.statusDocComplete')}</span>
                                ) : (
                                  <span className="text-rose-600">{t('insurance.statusDocMissing')}</span>
                                )}
                              </td>
                            )}
                            {isColVisible('contract') && (
                              <td className="border border-slate-300 text-center py-1 px-0.5 font-bold">
                                {row.contract === 'available' ? (
                                  <span className="text-emerald-700">{t('insurance.statusDocComplete')}</span>
                                ) : (
                                  <span className="text-rose-600">{t('insurance.statusDocMissing')}</span>
                                )}
                              </td>
                            )}
                            {isColVisible('status') && (
                              <td className="border border-slate-300 text-center py-1 px-1">
                                <span
                                  className={cn(
                                    'inline-block px-2 py-0.5 rounded text-[9px] font-black',
                                    row.status === 'complete'
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                                  )}
                                >
                                  {row.status === 'complete' ? t('insurance.statusFileComplete') : t('insurance.statusFileIncomplete')}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-900">
                        <td colSpan={missingCols.filter(c => c.visible).length} className="py-1.5 px-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span>
                              {t('insurance.printTotalRecordsLabel')}{' '}
                              <strong className="text-brand-700">{displayedMissing.length}</strong>{' '}
                              {t('insurance.employeeUnit')}
                            </span>
                            <span className="text-slate-500 font-normal text-[10px]">
                              {t('insurance.printSystemFooterGamasa')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )
              ) : (
                /* TAB 2: SOCIAL INSURANCE REPORT TABLE */
                displayedSocial.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-lg">
                    لا توجد سجلات تأمينية مطابقة للخيارات المحددة
                  </div>
                ) : (
                  <table
                    className="w-full border-collapse border border-slate-800 text-[9.5px] leading-tight"
                    style={{ tableLayout: 'fixed', width: '100%' }}
                  >
                    <colgroup>
                      {isColVisible('seq') && <col style={{ width: getColWidth('seq') }} />}
                      {isColVisible('nationalId') && <col style={{ width: getColWidth('nationalId') }} />}
                      {isColVisible('employeeName') && <col style={{ width: getColWidth('employeeName') }} />}
                      {isColVisible('employeeCode') && <col style={{ width: getColWidth('employeeCode') }} />}
                      {isColVisible('department') && <col style={{ width: getColWidth('department') }} />}
                      {isColVisible('insuranceNumber') && <col style={{ width: getColWidth('insuranceNumber') }} />}
                      {isColVisible('insuranceSalary') && <col style={{ width: getColWidth('insuranceSalary') }} />}
                      {isColVisible('workerShare') && <col style={{ width: getColWidth('workerShare') }} />}
                      {isColVisible('companyShare') && <col style={{ width: getColWidth('companyShare') }} />}
                      {isColVisible('totalContribution') && <col style={{ width: getColWidth('totalContribution') }} />}
                      {isColVisible('employeeListStatus') && <col style={{ width: getColWidth('employeeListStatus') }} />}
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold border-b border-slate-900 text-center">
                        {isColVisible('seq') && <th className="border border-slate-700 py-1 px-1">{getColLabel('seq')}</th>}
                        {isColVisible('nationalId') && <th className="border border-slate-700 py-1 px-1">{getColLabel('nationalId')}</th>}
                        {isColVisible('employeeName') && <th className="border border-slate-700 py-1 px-1.5 text-right">{getColLabel('employeeName')}</th>}
                        {isColVisible('employeeCode') && <th className="border border-slate-700 py-1 px-1">{getColLabel('employeeCode')}</th>}
                        {isColVisible('department') && <th className="border border-slate-700 py-1 px-1">{getColLabel('department')}</th>}
                        {isColVisible('insuranceNumber') && <th className="border border-slate-700 py-1 px-1">{getColLabel('insuranceNumber')}</th>}
                        {isColVisible('insuranceSalary') && <th className="border border-slate-700 py-1 px-1">{getColLabel('insuranceSalary')}</th>}
                        {isColVisible('workerShare') && <th className="border border-slate-700 py-1 px-1">{getColLabel('workerShare')}</th>}
                        {isColVisible('companyShare') && <th className="border border-slate-700 py-1 px-1">{getColLabel('companyShare')}</th>}
                        {isColVisible('totalContribution') && <th className="border border-slate-700 py-1 px-1">{getColLabel('totalContribution')}</th>}
                        {isColVisible('employeeListStatus') && <th className="border border-slate-700 py-1 px-1">{getColLabel('employeeListStatus')}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {displayedSocial.map((row, idx) => {
                        const isEven = idx % 2 === 1;
                        const total = (Number(row.workerShare) || 0) + (Number(row.companyShare) || 0);
                        return (
                          <tr
                            key={row.id}
                            className={cn(isEven ? 'bg-slate-50' : 'bg-white', 'border-b border-slate-300')}
                            style={{ pageBreakInside: 'avoid' }}
                          >
                            {isColVisible('seq') && (
                              <td className="border border-slate-300 text-center py-1 px-0.5 font-mono text-slate-500">
                                {idx + 1}
                              </td>
                            )}
                            {isColVisible('nationalId') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-mono font-bold text-slate-800">
                                {row.nationalId}
                              </td>
                            )}
                            {isColVisible('employeeName') && (
                              <td className="border border-slate-300 py-1 px-1.5 font-bold text-slate-900 text-right">
                                {row.employeeName}
                              </td>
                            )}
                            {isColVisible('employeeCode') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-mono text-slate-600">
                                {row.employeeCode || '-'}
                              </td>
                            )}
                            {isColVisible('department') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-semibold text-slate-700">
                                {row.department}
                              </td>
                            )}
                            {isColVisible('insuranceNumber') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-mono font-bold text-slate-900">
                                {row.insuranceNumber}
                              </td>
                            )}
                            {isColVisible('insuranceSalary') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-mono font-bold text-slate-900">
                                {Number(row.insuranceSalary).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            )}
                            {isColVisible('workerShare') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-mono text-slate-700">
                                {Number(row.workerShare).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            )}
                            {isColVisible('companyShare') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-mono text-slate-700">
                                {Number(row.companyShare).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            )}
                            {isColVisible('totalContribution') && (
                              <td className="border border-slate-300 text-center py-1 px-1 font-mono font-black text-brand-700">
                                {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            )}
                            {isColVisible('employeeListStatus') && (
                              <td className="border border-slate-300 text-center py-1 px-1">
                                <span
                                  className={cn(
                                    'inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold border',
                                    row.employeeListStatus === 'found'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-rose-50 text-rose-800 border-rose-300 font-black'
                                  )}
                                >
                                  {row.employeeListStatus === 'found' ? t('insurance.statusSheetFound') : t('insurance.statusSheetNotFound')}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-900">
                        <td colSpan={socialCols.filter(c => c.visible).length} className="py-1.5 px-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span>
                              {selectedListStatusFilter === 'not_found'
                                ? t('insurance.tabPrintSocialNotFound') + ': '
                                : selectedListStatusFilter === 'found'
                                ? t('insurance.tabPrintSocialFound') + ': '
                                : t('insurance.printTotalRecordsLabel') + ' '}
                              <strong
                                className={cn(
                                  selectedListStatusFilter === 'not_found' ? 'text-rose-700' : 'text-brand-700'
                                )}
                              >
                                {displayedSocial.length}
                              </strong>{' '}
                              {t('insurance.employeeUnit')} • {t('insurance.printTotalContributionsLabel')}{' '}
                              <strong className="text-emerald-700 font-mono">
                                {socialStats.totalContrib.toLocaleString()} {t('insurance.currency')}
                              </strong>
                            </span>
                            <span className="text-slate-500 font-normal text-[10px]">
                              {t('insurance.printSystemFooterGamasa')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )
              )}
            </div>

            {/* Approval Signatures Footer */}
            {includeSignatures && (
              <div
                className="sign-box mt-5 pt-3 border-t-2 border-slate-300"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                  {/* Prepared By */}
                  <div className="space-y-4">
                    <div className="font-bold text-slate-900">
                      {t('insurance.prepBy')}
                    </div>
                    <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
                    <div className="text-[10px] text-slate-500">{t('insurance.prepSub')}</div>
                  </div>

                  {/* Reviewed By */}
                  <div className="space-y-4">
                    <div className="font-bold text-slate-900">
                      {t('insurance.revBy')}
                    </div>
                    <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
                    <div className="text-[10px] text-slate-500">{t('insurance.revSub')}</div>
                  </div>

                  {/* Approved By */}
                  <div className="space-y-4">
                    <div className="font-bold text-slate-900">
                      {t('insurance.appBy')}
                    </div>
                    <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
                    <div className="text-[10px] text-slate-500">{t('insurance.appSub')}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
