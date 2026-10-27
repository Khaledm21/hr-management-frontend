import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Printer,
  Download,
  X,
  SlidersHorizontal,
  Building2,
  Search,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Employee } from '../../../types';
import { useCompany } from '../../../context/CompanyContext';
import { cn, downloadCSV } from '../../../lib/utils';
import newHopeLogo from '../../../assets/new-hope-logo.png';

interface EmployeePrintTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialSelectedIds?: string[];
  departmentFilter?: string;
  statusFilter?: string;
}

interface ColumnOption {
  id: string;
  labelKey: string;
  defaultLabel: string;
  visible: boolean;
  width: string;
}

/**
 * Cleanly format position titles to guarantee exactly:
 * Top: English (if available)
 * Bottom: Chinese (if available)
 * Without any awkward duplication or repetition!
 */
export function formatPosition(
  chinesePosition?: string | null,
  positionTitle?: string | null
): { en: string; zh: string } {
  let zh = '';
  let en = '';

  const rawZh = (chinesePosition || '').trim();
  const rawTitle = (positionTitle || '').trim();
  const hasChinese = (s: string) => /[\u4e00-\u9fa5]/.test(s);

  if (rawZh) {
    if (rawZh.includes(' - ')) {
      const parts = rawZh.split(' - ').map(p => p.trim());
      for (const p of parts) {
        if (hasChinese(p)) {
          zh = zh ? `${zh} ${p}` : p;
        } else if (p && !hasChinese(p)) {
          en = en ? `${en} ${p}` : p;
        }
      }
    } else if (rawZh.includes('/')) {
      const parts = rawZh.split('/').map(p => p.trim());
      for (const p of parts) {
        if (hasChinese(p)) {
          zh = zh ? `${zh} ${p}` : p;
        } else if (p && !hasChinese(p)) {
          en = en ? `${en} ${p}` : p;
        }
      }
    } else if (hasChinese(rawZh)) {
      const match = rawZh.match(/^([\u4e00-\u9fa5\s0-9]+)(?:[-–—\s/]+([a-zA-Z\s0-9]+))?$/);
      if (match) {
        zh = match[1].trim();
        if (match[2] && !en) en = match[2].trim();
      } else {
        zh = rawZh;
      }
    } else {
      en = rawZh.replace(/^[-–—/\s]+/, '').trim();
    }
  }

  if (rawTitle) {
    const cleanTitle = rawTitle.replace(/^[-–—/\s]+/, '').trim();
    if (hasChinese(cleanTitle)) {
      if (!zh) zh = cleanTitle;
    } else {
      if (!en) en = cleanTitle;
    }
  }

  zh = zh.replace(/^[-–—/\s]+|[-–—/\s]+$/g, '').trim();
  en = en.replace(/^[-–—/\s]+|[-–—/\s]+$/g, '').trim();

  if (!en && !zh) {
    en = rawTitle || rawZh || '-';
  }

  // Prevent exact identical text from repeating
  if (zh && en && zh.toLowerCase() === en.toLowerCase()) {
    zh = '';
  }

  return { en, zh };
}

export const EmployeePrintTableModal: React.FC<EmployeePrintTableModalProps> = ({
  isOpen,
  onClose,
  employees,
  initialSelectedIds = [],
  departmentFilter,
  statusFilter,
}) => {
  const { t, i18n } = useTranslation();
  const { logo, settings, companyName } = useCompany();
  const isRtl = i18n.language === 'ar';
  const isZh = i18n.language === 'zh-CN';
  const lang = i18n.language;

  // Controls
  const [dataScope, setDataScope] = useState<'all' | 'selected'>(
    initialSelectedIds.length > 0 ? 'selected' : 'all'
  );
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>(
    departmentFilter && departmentFilter !== 'all' ? departmentFilter : 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Sync with prop if departmentFilter changes
  React.useEffect(() => {
    if (departmentFilter && departmentFilter !== 'all') {
      setSelectedDeptFilter(departmentFilter);
    }
  }, [departmentFilter]);

  // Extract distinct departments with counts for direct selection
  const departmentsList = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(e => {
      const d = e.departmentName?.trim() || t('employees.noDepartment', 'بدون قسم');
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [employees, t]);

  // Column definitions with designated proportional widths for A4 landscape
  const [columns, setColumns] = useState<ColumnOption[]>([
    { id: 'seq', labelKey: 'employees.printColSeq', defaultLabel: '#', visible: true, width: '3.5%' },
    { id: 'empId', labelKey: 'employees.printColEmpId', defaultLabel: 'الرقم الوظيفي', visible: true, width: '8.5%' },
    { id: 'name', labelKey: 'employees.printColName', defaultLabel: 'اسم الموظف', visible: true, width: '20%' },
    { id: 'department', labelKey: 'employees.printColDepartment', defaultLabel: 'القسم / الإدارة', visible: true, width: '12%' },
    { id: 'position', labelKey: 'employees.printColPosition', defaultLabel: 'المسمى الوظيفي', visible: true, width: '16%' },
    { id: 'nationalId', labelKey: 'employees.printColNationalId', defaultLabel: 'الرقم القومي', visible: true, width: '12.5%' },
    { id: 'phone', labelKey: 'employees.printColPhone', defaultLabel: 'رقم الهاتف', visible: true, width: '9.5%' },
    { id: 'status', labelKey: 'employees.printColStatus', defaultLabel: 'الحالة', visible: true, width: '6%' },
    { id: 'insurance', labelKey: 'employees.printColInsurance', defaultLabel: 'التأمين الاجتماعي', visible: true, width: '6.5%' },
    { id: 'hireDate', labelKey: 'employees.printColHireDate', defaultLabel: 'تاريخ التعيين', visible: true, width: '5.5%' },
    { id: 'workLocation', labelKey: 'employees.printColWorkLocation', defaultLabel: 'مقر العمل', visible: false, width: '8%' },
    { id: 'salary', labelKey: 'employees.printColSalary', defaultLabel: 'الراتب الأساسي', visible: false, width: '7%' },
    { id: 'signature', labelKey: 'employees.printColSignature', defaultLabel: 'توقيع الموظف', visible: false, width: '8%' },
  ]);

  const toggleColumn = (id: string) => {
    setColumns(prev =>
      prev.map(col => (col.id === id ? { ...col, visible: !col.visible } : col))
    );
  };

  const isColumnVisible = (id: string) => columns.find(c => c.id === id)?.visible ?? false;
  const getColWidth = (id: string) => columns.find(c => c.id === id)?.width || 'auto';

  // Filter employees according to scope, selected department, and local search
  const displayedEmployees = useMemo(() => {
    let list = employees;
    if (dataScope === 'selected' && initialSelectedIds.length > 0) {
      list = list.filter(e => initialSelectedIds.includes(e.id));
    }

    if (selectedDeptFilter !== 'all') {
      list = list.filter(emp => {
        const d = emp.departmentName?.trim() || t('employees.noDepartment', 'بدون قسم');
        return d === selectedDeptFilter;
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(emp => {
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const arName = (emp.arabicName || '').toLowerCase();
        const empId = (emp.employeeId || '').toLowerCase();
        const dept = (emp.departmentName || '').toLowerCase();
        const pos = (emp.positionTitle || '').toLowerCase();
        const posZh = (emp.chinesePosition || '').toLowerCase();
        const nationalId = (emp.nationalId || '').toLowerCase();
        const phone = (emp.phone || '').toLowerCase();

        return (
          fullName.includes(q) ||
          arName.includes(q) ||
          empId.includes(q) ||
          dept.includes(q) ||
          pos.includes(q) ||
          posZh.includes(q) ||
          nationalId.includes(q) ||
          phone.includes(q)
        );
      });
    }

    return list;
  }, [employees, dataScope, initialSelectedIds, selectedDeptFilter, searchTerm, t]);

  // Statistics
  const stats = useMemo(() => {
    const total = displayedEmployees.length;
    const active = displayedEmployees.filter(e => e.employmentStatus === 'active').length;
    const insured = displayedEmployees.filter(e => e.insuranceStatus === 'insured').length;
    const depts = new Set(displayedEmployees.map(e => e.departmentName).filter(Boolean)).size;
    return { total, active, insured, depts };
  }, [displayedEmployees]);

  // Formatted date and time
  const printDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleString(isRtl ? 'ar-EG' : isZh ? 'zh-CN' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }, [isRtl, isZh]);

  // Status mapping
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return t('common.active', 'نشط');
      case 'probation':
        return t('common.probation', 'فترة تجربة');
      case 'on_leave':
        return t('common.onLeave', 'في إجازة');
      case 'suspended':
        return t('common.suspended', 'موقوف');
      case 'terminated':
        return t('common.terminated', 'منتهي الخدمة');
      default:
        return status;
    }
  };

  // Print execution using isolated iframe
  const handlePrint = () => {
    const reportElem = document.getElementById('employee-directory-printable-table');
    if (!reportElem) {
      window.print();
      return;
    }

    const oldIframe = document.getElementById('employee-table-print-frame');
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'employee-table-print-frame';
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

    // Extract all styles and links from active document (so Tailwind is 100% active)
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    const fontFamily = isRtl
      ? "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif"
      : isZh
      ? "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
      : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${lang}">
      <head>
        <meta charset="utf-8" />
        <title>${t('employees.printModalTitle', 'جدول بيانات الموظفين')}</title>
        ${styles}
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm 6mm;
          }
          @media print {
            @page {
              size: A4 landscape;
              margin: 8mm 6mm;
            }
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: ${fontFamily} !important;
            direction: ${isRtl ? 'rtl' : 'ltr'} !important;
            width: 100% !important;
            -webkit-font-smoothing: antialiased;
          }
          #print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Rigid constraints on logo to prevent any image blowup */
          img {
            height: 40px !important;
            max-height: 40px !important;
            width: auto !important;
            max-width: 120px !important;
            object-fit: contain !important;
            display: inline-block !important;
          }
          .print-header-row {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
          }
          .print-stats-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 8px !important;
            page-break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          th {
            background-color: #0f172a !important;
            color: #ffffff !important;
            font-weight: 700 !important;
            font-size: 10px !important;
            padding: 6px 2px !important;
            border: 1px solid #1e293b !important;
            text-align: center !important;
            word-break: normal !important;
            overflow-wrap: normal !important;
          }
          td {
            padding: 4px 4px !important;
            border: 1px solid #cbd5e1 !important;
            font-size: 9.5px !important;
            line-height: 1.25 !important;
            vertical-align: middle !important;
            word-break: normal !important;
            overflow-wrap: break-word !important;
          }
          tbody tr:nth-child(even) {
            background-color: #f8fafc !important;
          }
          tbody tr:nth-child(odd) {
            background-color: #ffffff !important;
          }
          .print-signatures-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 24px !important;
            margin-top: 20px !important;
            padding-top: 10px !important;
            border-top: 1px solid #cbd5e1 !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div id="print-wrapper">
          ${reportElem.innerHTML}
        </div>
      </body>
      </html>
    `);
    doc.close();

    // Trigger print safely after images and styles are ready
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print iframe failed, fallback to window.print', err);
        window.print();
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }
    }, 400);
  };

  const handleExportCSV = () => {
    if (displayedEmployees.length === 0) return;
    const exportData = displayedEmployees.map((emp, index) => {
      const row: Record<string, any> = {};
      if (isColumnVisible('seq')) row['#'] = index + 1;
      if (isColumnVisible('empId')) row[t('employees.empId', 'Employee ID')] = emp.employeeId;
      if (isColumnVisible('name'))
        row[t('employees.name', 'Name')] = `${emp.firstName} ${emp.lastName} ${
          emp.arabicName ? `(${emp.arabicName})` : ''
        }`.trim();
      if (isColumnVisible('department'))
        row[t('common.department', 'Department')] = emp.departmentName;
      if (isColumnVisible('position')) {
        const { en: posEn, zh: posZh } = formatPosition(emp.chinesePosition, emp.positionTitle);
        row[t('common.position', 'Position')] = posZh && posEn ? `${posEn} / ${posZh}` : (posEn || posZh || '-');
      }
      if (isColumnVisible('nationalId'))
        row[t('employees.nationalIdShort', 'National ID')] = emp.nationalId;
      if (isColumnVisible('phone')) row[t('employees.contact', 'Phone')] = emp.phone || '-';
      if (isColumnVisible('status'))
        row[t('common.status', 'Status')] = getStatusLabel(emp.employmentStatus);
      if (isColumnVisible('insurance'))
        row[t('employees.insuranceStatus', 'Insurance')] =
          emp.insuranceStatus === 'insured'
            ? `${t('employees.insured', 'مؤمن عليه')}${emp.insuranceNumber ? ` (${emp.insuranceNumber})` : ''}`
            : t('employees.notInsured', 'غير مؤمن');
      if (isColumnVisible('hireDate')) row[t('employees.hireDate', 'Hire Date')] = emp.hireDate;
      if (isColumnVisible('workLocation'))
        row[t('employees.valLocationRequired', 'Work Location')] = emp.workLocation || '-';
      if (isColumnVisible('salary'))
        row[t('employees.printColSalary', 'Basic Salary')] = emp.basicSalary || '-';

      return row;
    });

    downloadCSV('Employees_Table_Directory', exportData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-50 dark:bg-brand-950/50 rounded-xl text-brand-600 dark:text-[#38BDF8]">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
              {t('employees.printModalTitle', 'معاينة وطباعة جدول الموظفين')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-normal">
              {t('employees.printModalSubtitle', 'سجل وكشف بيانات العاملين الرسمي بالمنشأة')}
            </p>
          </div>
        </div>
      }
      size="full"
    >
      <div className="space-y-4">
        {/* Top Controls Toolbar */}
        <div className="bg-slate-50 dark:bg-[#0B0F19] p-3.5 rounded-xl border border-slate-200 dark:border-[#1E293B] shadow-xs no-print space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left Controls: Scope & Columns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Data Scope Toggle */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setDataScope('all')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5',
                    dataScope === 'all'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {t('employees.printScopeAll', { count: employees.length })}
                  </span>
                </button>
                {initialSelectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDataScope('selected')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5',
                      dataScope === 'selected'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {t('employees.printScopeSelected', { count: initialSelectedIds.length })}
                    </span>
                  </button>
                )}
              </div>

              {/* Department Selector */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#151D2E] border border-slate-200 dark:border-[#1E293B] rounded-lg px-2.5 py-1.5 shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-[#38BDF8] shrink-0" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {t('employees.printByDept', 'القسم:')}
                </span>
                <select
                  value={selectedDeptFilter}
                  onChange={e => setSelectedDeptFilter(e.target.value)}
                  className="text-xs font-bold bg-transparent text-slate-900 dark:text-white border-none focus:outline-none focus:ring-0 cursor-pointer pr-1"
                >
                  <option value="all" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">
                    {t('employees.printAllDepts', 'كافة الأقسام')} ({employees.length})
                  </option>
                  {departmentsList.map(dept => (
                    <option
                      key={dept.name}
                      value={dept.name}
                      className="dark:bg-[#151D2E] dark:text-[#F8FAFC]"
                    >
                      {dept.name} ({dept.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Column Selection Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                  onClick={() => setShowColumnPicker(!showColumnPicker)}
                  className="text-xs"
                >
                  {t('employees.printColumnsTitle', 'الأعمدة')}
                </Button>
                {showColumnPicker && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1.5 w-60 bg-white dark:bg-[#151D2E] rounded-xl shadow-xl border border-slate-200 dark:border-[#1E293B] p-2.5 z-40 animate-in fade-in zoom-in-95">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase px-2 py-1 border-b border-slate-100 dark:border-[#1E293B] mb-1 flex items-center justify-between">
                      <span>{t('employees.printColumnsTitle', 'الأعمدة')}</span>
                      <button
                        onClick={() => setShowColumnPicker(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                      {columns.map(col => (
                        <label
                          key={col.id}
                          className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E293B] rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={col.visible}
                            onChange={() => toggleColumn(col.id)}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer accent-brand-600"
                          />
                          <span className="font-medium">{t(col.labelKey, col.defaultLabel)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportCSV}
                title={t('employees.exportEmployees', 'تصدير CSV')}
              >
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                {t('common.close', 'إغلاق')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
                className="font-bold shadow-md shadow-brand-500/20 bg-brand-600 hover:bg-brand-700"
              >
                {t('employees.printNow', 'طباعة الجدول الآن')}
              </Button>
            </div>
          </div>

          {/* Quick Filters Strip & Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-[#1E293B]/70 text-xs">
            {/* Live Search inside preview */}
            <div className="relative min-w-[240px] max-w-sm flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('employees.printSearchPlaceholder', 'تصفية سريعة داخل المعاينة...')}
                className="w-full pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Layout Toggles */}
            <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-300 font-medium">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={e => setIncludeHeader(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 accent-brand-600"
                />
                <span>{t('employees.printShowCompanyHeader', 'ترويسة الشركة')}</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={e => setIncludeStats(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 accent-brand-600"
                />
                <span>{t('employees.printShowStats', 'شريط الإحصائيات')}</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={e => setIncludeSignatures(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 accent-brand-600"
                />
                <span>{t('employees.printShowSignatures', 'خانات الاعتماد والتوقيع')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Printable Area Container */}
        <div className="overflow-x-auto bg-slate-200/50 dark:bg-black/40 p-4 rounded-xl border border-slate-200 dark:border-[#1E293B]">
          <div
            id="employee-directory-printable-table"
            className="bg-white text-slate-900 mx-auto p-6 rounded-lg shadow-sm printable-content print:p-0 print:border-none print:shadow-none transition-all max-w-[1300px]"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Header Section */}
            {includeHeader && (
              <div
                className="print-header-row border-b-2 border-slate-900 pb-3 mb-3"
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
              >
                <div
                  className="flex items-center justify-between gap-4 w-full"
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                >
                  {/* Company Logo & Identity */}
                  <div className="flex items-center gap-3 shrink-0" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!imgError ? (
                      <img
                        src={logo || newHopeLogo}
                        alt="Company Logo"
                        onError={() => setImgError(true)}
                        style={{ height: '40px', maxHeight: '40px', width: 'auto', maxWidth: '120px', objectFit: 'contain', display: 'inline-block' }}
                        className="h-10 w-auto max-h-[40px] max-w-[120px] object-contain border border-slate-200 rounded p-1 bg-white shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg border border-slate-200 bg-brand-50 flex items-center justify-center text-brand-700 font-bold shrink-0">
                        <Building2 className="w-5 h-5 text-brand-600" />
                      </div>
                    )}
                    <div>
                      <div
                        dir="ltr"
                        className={cn(
                          'font-black text-xs md:text-sm text-slate-950 tracking-tight whitespace-nowrap leading-tight',
                          isRtl ? 'text-right' : 'text-left'
                        )}
                      >
                        {settings.companyName || 'NEW HOPE EGYPT'}
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 whitespace-nowrap mt-0.5">
                        {settings.companyNameAr || companyName || 'شركة نيو هوب مصر'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9.5px] bg-brand-50 text-brand-800 border border-brand-200 px-2 py-0.5 rounded font-bold whitespace-nowrap">
                          {t('employees.directory', 'دليل الموظفين')}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold whitespace-nowrap">
                          {t('employees.printSystemName', 'نظام إدارة الموارد البشرية')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center Title & Report Details */}
                  <div className="text-center px-3 flex-1">
                    <h1 className="text-base md:text-lg font-black text-slate-950 tracking-tight whitespace-nowrap leading-tight">
                      {selectedDeptFilter !== 'all'
                        ? `${t('employees.printModalTitle', 'كشف وسجل بيانات العاملين')} - ${selectedDeptFilter}`
                        : t('employees.printModalTitle', 'كشف وسجل بيانات العاملين')}
                    </h1>
                    <div className="text-[10px] font-bold text-slate-500 tracking-wide mt-0.5 whitespace-nowrap uppercase">
                      {t('employees.printModalSubtitle', 'WORKFORCE DIRECTORY & MASTER RECORD')}
                      {selectedDeptFilter !== 'all' ? ` • ${selectedDeptFilter.toUpperCase()}` : ''}
                    </div>
                    {/* Active Filters metadata chips */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5 text-[10px] font-semibold text-slate-600">
                      {selectedDeptFilter !== 'all' ? (
                        <span className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-900 px-2 py-0.5 rounded font-bold">
                          <Building2 className="w-3 h-3 text-brand-600" />
                          <span className="text-slate-600">{t('employees.printFilterDept', 'القسم:')}</span>
                          <span className="font-extrabold text-slate-950">{selectedDeptFilter}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          <span className="text-slate-500">{t('employees.printFilterDept', 'القسم:')}</span>
                          <span className="font-bold text-slate-900">{t('employees.printAllDepts', 'كافة الأقسام')}</span>
                        </span>
                      )}
                      {statusFilter && statusFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          <span className="text-slate-500">{t('employees.printFilterStatus', 'الحالة:')}</span>
                          <span className="font-bold text-slate-900">{getStatusLabel(statusFilter)}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        <span className="text-slate-500">{t('employees.printGeneratedAt', 'تاريخ الطباعة:')}</span>
                        <span className="font-mono font-bold text-slate-900">{printDate}</span>
                      </span>
                    </div>
                  </div>

                  {/* Summary Count Box */}
                  <div className="border-2 border-slate-900 rounded-lg p-2 text-center bg-slate-50/80 shrink-0 min-w-[120px]">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">
                      {selectedDeptFilter !== 'all'
                        ? t('employees.printDeptEmployees', 'موظفو القسم')
                        : t('employees.printTotalEmployees', 'إجمالي الموظفين')}
                    </div>
                    <div className="text-xl font-black text-brand-700 leading-none mt-1">
                      {displayedEmployees.length}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-medium truncate max-w-[130px]">
                      {selectedDeptFilter !== 'all'
                        ? selectedDeptFilter
                        : dataScope === 'selected'
                        ? t('employees.printScopeSelected', { count: displayedEmployees.length })
                        : t('employees.printScopeAll', { count: displayedEmployees.length })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick KPI Stats Bar */}
            {includeStats && (
              <div
                className="print-stats-grid grid grid-cols-4 gap-2 mb-2 text-center"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', pageBreakInside: 'avoid' }}
              >
                <div className="border border-slate-300 rounded py-1 px-2 bg-slate-50">
                  <div className="text-[9px] font-bold text-slate-500">{t('employees.printTotalEmployees', 'إجمالي الموظفين')}</div>
                  <div className="text-xs font-black text-slate-900">{stats.total}</div>
                </div>
                <div className="border border-emerald-300 rounded py-1 px-2 bg-emerald-50/60">
                  <div className="text-[9px] font-bold text-emerald-800">{t('employees.printActiveCount', 'على رأس العمل')}</div>
                  <div className="text-xs font-black text-emerald-900">{stats.active}</div>
                </div>
                <div className="border border-blue-300 rounded py-1 px-2 bg-blue-50/60">
                  <div className="text-[9px] font-bold text-blue-800">{t('employees.printInsuredCount', 'مؤمن عليهم')}</div>
                  <div className="text-xs font-black text-blue-900">{stats.insured}</div>
                </div>
                <div className="border border-purple-300 rounded py-1 px-2 bg-purple-50/60">
                  <div className="text-[9px] font-bold text-purple-800">{t('employees.printDeptCount', 'عدد الأقسام')}</div>
                  <div className="text-xs font-black text-purple-900">{stats.depts}</div>
                </div>
              </div>
            )}

            {/* Table */}
            {displayedEmployees.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-lg">
                {t('employees.printNoData', 'لا يوجد موظفون مطابقون للعرض والطباعة')}
              </div>
            ) : (
              <div className="w-full">
                <table
                  className="w-full border-collapse border-2 border-slate-900 text-slate-900 text-[9.5px] leading-tight"
                  style={{ tableLayout: 'fixed', width: '100%' }}
                >
                  <colgroup>
                    {isColumnVisible('seq') && <col style={{ width: getColWidth('seq') }} />}
                    {isColumnVisible('empId') && <col style={{ width: getColWidth('empId') }} />}
                    {isColumnVisible('name') && <col style={{ width: getColWidth('name') }} />}
                    {isColumnVisible('department') && <col style={{ width: getColWidth('department') }} />}
                    {isColumnVisible('position') && <col style={{ width: getColWidth('position') }} />}
                    {isColumnVisible('nationalId') && <col style={{ width: getColWidth('nationalId') }} />}
                    {isColumnVisible('phone') && <col style={{ width: getColWidth('phone') }} />}
                    {isColumnVisible('status') && <col style={{ width: getColWidth('status') }} />}
                    {isColumnVisible('insurance') && <col style={{ width: getColWidth('insurance') }} />}
                    {isColumnVisible('hireDate') && <col style={{ width: getColWidth('hireDate') }} />}
                    {isColumnVisible('workLocation') && <col style={{ width: getColWidth('workLocation') }} />}
                    {isColumnVisible('salary') && <col style={{ width: getColWidth('salary') }} />}
                    {isColumnVisible('signature') && <col style={{ width: getColWidth('signature') }} />}
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold border-b-2 border-slate-900">
                      {isColumnVisible('seq') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          #
                        </th>
                      )}
                      {isColumnVisible('empId') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          {t('employees.empId', 'الرقم الوظيفي')}
                        </th>
                      )}
                      {isColumnVisible('name') && (
                        <th className={cn('border border-slate-700 py-1.5 px-2 font-bold', isRtl ? 'text-right' : 'text-left')}>
                          {t('employees.name', 'اسم الموظف')}
                        </th>
                      )}
                      {isColumnVisible('department') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          {t('common.department', 'القسم')}
                        </th>
                      )}
                      {isColumnVisible('position') && (
                        <th className={cn('border border-slate-700 py-1.5 px-1.5 font-bold', isRtl ? 'text-right' : 'text-left')}>
                          {t('common.position', 'المسمى الوظيفي')}
                        </th>
                      )}
                      {isColumnVisible('nationalId') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          {t('employees.nationalIdShort', 'الرقم القومي')}
                        </th>
                      )}
                      {isColumnVisible('phone') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          {t('employees.contact', 'الهاتف')}
                        </th>
                      )}
                      {isColumnVisible('status') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          {t('common.status', 'الحالة')}
                        </th>
                      )}
                      {isColumnVisible('insurance') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          {t('employees.insuranceStatus', 'التأمين')}
                        </th>
                      )}
                      {isColumnVisible('hireDate') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          {t('employees.hireDate', 'تاريخ التعيين')}
                        </th>
                      )}
                      {isColumnVisible('workLocation') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          {t('employees.valLocationRequired', 'المقر')}
                        </th>
                      )}
                      {isColumnVisible('salary') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          {t('employees.printColSalary', 'الراتب')}
                        </th>
                      )}
                      {isColumnVisible('signature') && (
                        <th className="border border-slate-700 text-center py-1.5 px-1 font-bold">
                          {t('employees.printColSignature', 'توقيع الموظف')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEmployees.map((emp, index) => {
                      const fullName = `${emp.firstName} ${emp.lastName}`.trim();
                      const hasDifferentArabicName =
                        emp.arabicName && emp.arabicName.trim().toLowerCase() !== fullName.toLowerCase();
                      const isEven = index % 2 === 0;
                      const { en: posEn, zh: posZh } = formatPosition(emp.chinesePosition, emp.positionTitle);

                      return (
                        <tr
                          key={emp.id}
                          className={cn(
                            'border-b border-slate-300 transition-colors',
                            isEven ? 'bg-white' : 'bg-slate-50/70'
                          )}
                        >
                          {isColumnVisible('seq') && (
                            <td className="border border-slate-300 text-center font-mono font-medium text-slate-500 py-1 px-1">
                              {index + 1}
                            </td>
                          )}
                          {isColumnVisible('empId') && (
                            <td className="border border-slate-300 text-center font-mono font-bold text-slate-900 py-1 px-1">
                              <span className="bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-[9.5px]">
                                {emp.employeeId}
                              </span>
                            </td>
                          )}
                          {isColumnVisible('name') && (
                            <td className={cn('border border-slate-300 py-1 px-2', isRtl ? 'text-right' : 'text-left')}>
                              <div className="font-bold text-slate-950 leading-tight">{fullName}</div>
                              {hasDifferentArabicName && (
                                <div className="text-[9px] font-semibold text-slate-600 mt-0.5 leading-tight">
                                  {emp.arabicName}
                                </div>
                              )}
                            </td>
                          )}
                          {isColumnVisible('department') && (
                            <td className="border border-slate-300 font-semibold text-slate-800 text-center py-1 px-1">
                              {emp.departmentName || '-'}
                            </td>
                          )}
                          {isColumnVisible('position') && (
                            <td className={cn('border border-slate-300 py-1 px-2', isRtl ? 'text-right' : 'text-left')}>
                              <div className="font-bold text-slate-900 leading-tight text-[9.5px]">
                                {posEn || posZh || '-'}
                              </div>
                              {posZh && posEn && (
                                <div className="text-[9px] text-slate-500 font-medium leading-tight mt-0.5">
                                  {posZh}
                                </div>
                              )}
                            </td>
                          )}
                          {isColumnVisible('nationalId') && (
                            <td className="border border-slate-300 text-center font-mono text-slate-800 py-1 px-1 text-[9px]">
                              {emp.nationalId || '-'}
                            </td>
                          )}
                          {isColumnVisible('phone') && (
                            <td className="border border-slate-300 text-center font-mono text-slate-800 py-1 px-1 text-[9px] dir-ltr">
                              {emp.phone || '-'}
                            </td>
                          )}
                          {isColumnVisible('status') && (
                            <td className="border border-slate-300 text-center py-1 px-1">
                              <span
                                className={cn(
                                  'inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border',
                                  emp.employmentStatus === 'active'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : emp.employmentStatus === 'probation'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : emp.employmentStatus === 'on_leave'
                                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                )}
                              >
                                {getStatusLabel(emp.employmentStatus)}
                              </span>
                            </td>
                          )}
                          {isColumnVisible('insurance') && (
                            <td className="border border-slate-300 text-center py-1 px-1">
                              {emp.insuranceStatus === 'insured' ? (
                                <div className="text-emerald-800 font-bold text-[9px] leading-tight">
                                  <span>{t('employees.insured', 'مؤمن عليه')}</span>
                                  {emp.insuranceNumber && (
                                    <span className="block font-mono text-[8.5px] text-slate-600 mt-0.5">
                                      #{emp.insuranceNumber}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-rose-700 font-semibold text-[9px]">
                                  {t('employees.notInsured', 'غير مؤمن')}
                                </span>
                              )}
                            </td>
                          )}
                          {isColumnVisible('hireDate') && (
                            <td className="border border-slate-300 text-center font-mono text-slate-700 py-1 px-1 text-[9px]">
                              {emp.hireDate || '-'}
                            </td>
                          )}
                          {isColumnVisible('workLocation') && (
                            <td className="border border-slate-300 text-center text-slate-700 py-1 px-1">
                              {emp.workLocation || '-'}
                            </td>
                          )}
                          {isColumnVisible('salary') && (
                            <td className="border border-slate-300 text-center font-mono font-bold text-slate-900 py-1 px-1">
                              {emp.basicSalary ? `${emp.basicSalary.toLocaleString()} ج.م` : '-'}
                            </td>
                          )}
                          {isColumnVisible('signature') && (
                            <td className="border border-slate-300 text-center h-7 py-1 px-1">
                              <div className="border-b border-dashed border-slate-400 w-20 mx-auto my-1" />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-900">
                      <td colSpan={columns.filter(c => c.visible).length} className="py-1.5 px-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span>
                            {t('employees.printTotalEmployees', 'إجمالي المسجلين بالكشف:')}{' '}
                            <strong className="text-brand-700">{displayedEmployees.length}</strong>{' '}
                            {t('common.employee', 'موظف')}
                          </span>
                          <span className="text-slate-500 font-normal text-[10px]">
                            {t('employees.printFooterSystem', 'نظام الموارد البشرية والعمليات')} • {printDate}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Approval Signatures Footer */}
            {includeSignatures && (
              <div
                className="print-signatures-grid mt-6 pt-3 border-t border-slate-300 break-inside-avoid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}
              >
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                  {/* Prepared By */}
                  <div className="space-y-4">
                    <div className="font-bold text-slate-800">
                      {t('employees.printPrepBy', 'إعداد: أخصائي الموارد البشرية')}
                    </div>
                    <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
                    <div className="text-[10px] text-slate-500">
                      {t('employees.printSignaturePlaceholder', 'التوقيع والاسم')}
                    </div>
                  </div>

                  {/* Reviewed By */}
                  <div className="space-y-4">
                    <div className="font-bold text-slate-800">
                      {t('employees.printReviewBy', 'مراجعة: مدير إدارة الموارد البشرية')}
                    </div>
                    <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
                    <div className="text-[10px] text-slate-500">
                      {t('employees.printSignaturePlaceholder', 'التوقيع والاسم')}
                    </div>
                  </div>

                  {/* Approved By */}
                  <div className="space-y-4">
                    <div className="font-bold text-slate-800">
                      {t('employees.printApproveBy', 'اعتماد: المدير العام / مدير الموقع')}
                    </div>
                    <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
                    <div className="text-[10px] text-slate-500">
                      {t('employees.printSignaturePlaceholder', 'التوقيع وخاتم المنشأة')}
                    </div>
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
