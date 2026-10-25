import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Table as TableIcon,
  ShieldCheck,
  FileCheck2,
  Users,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useToast } from './Toast';
import { employeeService } from '../../services/employeeService';
import { insuranceService } from '../../services/insuranceService';
import { realSeedEmployees, realSeedSocialInsurance } from '../../mocks/realExcelData';
import { parseEgyptianNationalId } from '../../lib/utils';

export type ImportTargetType = 'employees' | 'social_insurance' | 'missing_documents' | 'full_workbook';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: ImportTargetType;
  onImportComplete?: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultTarget = 'employees',
  onImportComplete,
}) => {
  const { t } = useTranslation();
  const { success, error: toastError, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetType, setTargetType] = useState<ImportTargetType>(defaultTarget);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsedSummary, setParsedSummary] = useState<{
    total: number;
    insuredCount?: number;
    notInsuredCount?: number;
    notFoundCount?: number;
    detectedSheets?: string[];
  } | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setParsedSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTargetChange = (type: ImportTargetType) => {
    setTargetType(type);
    resetState();
  };

  // 1. Download official pre-formatted Excel template matching the user's sheets
  const handleDownloadTemplate = (type: ImportTargetType) => {
    const wb = XLSX.utils.book_new();

    if (type === 'employees' || type === 'full_workbook') {
      const empData = realSeedEmployees.slice(0, 10).map((e, idx) => ({
        No: idx + 1,
        Department: e.departmentName || 'HR',
        Name: `${e.firstName} ${e.lastName}`,
        ID: e.nationalId,
        Position: e.chinesePosition || e.positionTitle,
        'Start date': e.hireDate,
        'Resignation Date': e.resignationDate || '',
        'Employee ID': e.employeeId,
        'Insurance Status': e.insuranceStatus === 'insured' ? 'Insured' : 'Not Insured',
      }));
      const ws1 = XLSX.utils.json_to_sheet(empData);
      XLSX.utils.book_append_sheet(wb, ws1, 'All Employees');
    }

    if (type === 'social_insurance' || type === 'full_workbook') {
      const insData = realSeedSocialInsurance.slice(0, 10).map(s => ({
        No: s.serialNo,
        'ID.': s.nationalId,
        Name: s.employeeName,
        Department: s.department,
        'Insurance Number': s.insuranceNumber,
        'Insurance Salary': s.insuranceSalary,
        Worker: s.workerShare,
        Company: s.companyShare,
        Note: s.note,
        'Employee List Status': s.employeeListStatus === 'found' ? 'Found' : 'Not Found',
      }));
      const ws2 = XLSX.utils.json_to_sheet(insData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Insured Employees');
    }

    if (type === 'missing_documents' || type === 'full_workbook') {
      const docData = realSeedEmployees
        .filter(e => e.insuranceStatus === 'not_insured')
        .slice(0, 10)
        .map((e, idx) => ({
          No: idx + 1,
          Department: e.departmentName || 'HR',
          Name: `${e.firstName} ${e.lastName}`,
          ID: e.nationalId,
          Position: e.chinesePosition || e.positionTitle,
          'Start date': e.hireDate,
          'Resignation Date': '',
          'Employee ID': e.employeeId,
          'Insurance Status': 'Not Insured',
          'Qualification Certificate': 'Missing',
          'Birth Certificate': 'Missing',
          'ID Card': 'Missing',
          Contract: 'Missing',
          Notes: 'Pending recruitment file completion',
          Status: 'Incomplete',
        }));
      const ws3 = XLSX.utils.json_to_sheet(docData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Missing Documents');
    }

    const filename =
      type === 'employees'
        ? 'All_Employees_Template.xlsx'
        : type === 'social_insurance'
        ? 'Social_Insurance_September_Template.xlsx'
        : type === 'missing_documents'
        ? 'Missing_Documents_Template.xlsx'
        : 'Company_HR_Full_Workbook_Template.xlsx';

    XLSX.writeFile(wb, filename);
    info(t('excelImport.templateDownloaded', { filename }));
  };

  // 2. Parse uploaded file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const sheetNames = workbook.SheetNames;

      let sheetToUse = sheetNames[0];

      if (targetType === 'employees') {
        const match = sheetNames.find(s => s.toLowerCase().includes('all') || s.toLowerCase().includes('employee') || s.includes('الموظفين'));
        if (match) sheetToUse = match;
      } else if (targetType === 'social_insurance') {
        const match = sheetNames.find(s => s.toLowerCase().includes('insur') || s.toLowerCase().includes('social') || s.includes('تأمين'));
        if (match) sheetToUse = match;
      } else if (targetType === 'missing_documents') {
        const match = sheetNames.find(s => s.toLowerCase().includes('miss') || s.toLowerCase().includes('doc') || s.includes('ناقص'));
        if (match) sheetToUse = match;
      }

      const activeWorksheet = workbook.Sheets[sheetToUse];
      const jsonData: any[] = XLSX.utils.sheet_to_json(activeWorksheet, { defval: '' });

      if (jsonData.length === 0) {
        toastError(t('excelImport.noDataRows'));
        setIsProcessing(false);
        return;
      }

      setParsedRows(jsonData);

      // Compute statistics based on target
      let insured = 0;
      let notInsured = 0;
      let notFound = 0;

      jsonData.forEach(row => {
        const insStatus = String(
          row['Insurance Status'] || row['حالة التأمين'] || row['Insurance'] || ''
        ).toLowerCase();
        if (insStatus.includes('not') || insStatus.includes('غير')) {
          notInsured++;
        } else if (insStatus.includes('ins') || insStatus.includes('مؤمن')) {
          insured++;
        }

        const matchStatus = String(
          row['Employee List Status'] || row['حالة المطابقة'] || row['Status'] || ''
        ).toLowerCase();
        if (matchStatus.includes('not found') || matchStatus.includes('غير')) {
          notFound++;
        }
      });

      setParsedSummary({
        total: jsonData.length,
        insuredCount: insured,
        notInsuredCount: notInsured,
        notFoundCount: notFound,
        detectedSheets: sheetNames,
      });

      success(t('excelImport.readSuccess', { count: jsonData.length, sheet: sheetToUse }));
    } catch (err: any) {
      console.error(err);
      toastError(t('excelImport.readError', { error: err.message || t('common.unknownError') }));
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Confirm and Save into Application Data
  const handleConfirmImport = async () => {
    if (!parsedRows || parsedRows.length === 0) return;
    setIsProcessing(true);

    try {
      const isOverwrite = importMode === 'replace';

      if (targetType === 'employees' || targetType === 'full_workbook') {
        const parseExcelDate = (val: any): string => {
          if (!val) return '2023-01-01';
          if (val instanceof Date) return val.toISOString().split('T')[0];
          if (typeof val === 'number') {
            const d = new Date(Math.round((val - 25569) * 86400 * 1000));
            return d.toISOString().split('T')[0];
          }
          const s = String(val).trim();
          if (!s) return '2023-01-01';
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          if (!isNaN(Number(s)) && Number(s) > 30000 && Number(s) < 60000) {
            const d = new Date(Math.round((Number(s) - 25569) * 86400 * 1000));
            return d.toISOString().split('T')[0];
          }
          const parsed = new Date(s);
          if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
          return '2023-01-01';
        };

        const mappedEmployees = parsedRows.map((row, idx) => {
          const fullName = String(row['Name'] || row['الاسم'] || row['اسم الموظف'] || `Employee ${idx + 1}`).trim();
          const parts = fullName.split(/\s+/);
          const firstName = parts[0] || 'Employee';
          const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'Staff';

          const nationalId = String(row['ID'] || row['ID.'] || row['الرقم القومي'] || `2900000000000${idx + 1}`).trim();
          const parsedId = parseEgyptianNationalId(nationalId);
          const gender = parsedId?.gender || (row['Gender'] || row['النوع'] ? (String(row['Gender'] || row['النوع']).toLowerCase().includes('fem') || String(row['Gender'] || row['النوع']).includes('أنث') ? 'female' : 'male') : 'male');
          const dateOfBirth = parsedId?.dateOfBirth;

          const employeeId = String(row['Employee ID'] || row['كود الموظف'] || `180301${String(idx + 1).padStart(3, '0')}`).trim();
          const position = String(row['Position'] || row['الوظيفة'] || 'Staff').trim();
          const department = String(row['Department'] || row['القسم'] || 'HR').trim();
          const hireDate = parseExcelDate(row['Start date'] || row['تاريخ التعيين']);
          const resignationDate = row['Resignation Date'] ? parseExcelDate(row['Resignation Date']) : undefined;

          const rawIns = String(row['Insurance Status'] || row['حالة التأمين'] || '').toLowerCase();
          const isInsured = rawIns.includes('not') || rawIns.includes('غير') ? false : true;

          const seedMatch = realSeedEmployees.find(s => s.employeeId === employeeId || s.nationalId === nationalId);
          const arabicName = seedMatch?.arabicName || fullName;

          return {
            employeeId,
            name: fullName,
            firstName,
            lastName,
            arabicName,
            nationalId,
            gender,
            dateOfBirth,
            department: department,
            departmentName: department,
            position: position,
            positionTitle: position.includes('-') ? position.split('-')[1].trim() : position,
            chinesePosition: position,
            hireDate,
            resignationDate: resignationDate || undefined,
            insuranceStatus: (isInsured ? 'insured' : 'not_insured') as 'insured' | 'not_insured',
            insuranceSalary: isInsured ? 4325.00 : undefined,
            workerShare: isInsured ? 475.85 : undefined,
            companyShare: isInsured ? 811.13 : undefined,
            qualificationCertificateStatus: (isInsured ? 'available' : 'missing') as 'available' | 'missing',
            birthCertificateStatus: (isInsured ? 'available' : 'missing') as 'available' | 'missing',
            idCardStatus: (isInsured ? 'available' : 'missing') as 'available' | 'missing',
            contractDocStatus: (isInsured ? 'available' : 'missing') as 'available' | 'missing',
            documentChecklistStatus: (isInsured ? 'complete' : 'incomplete') as 'complete' | 'incomplete',
            missingDocumentsCount: isInsured ? 0 : 4,
            documentCompletenessPercentage: isInsured ? 100 : 0,
          };
        });

        await employeeService.importEmployees(mappedEmployees, isOverwrite);
      }

      if (targetType === 'social_insurance') {
        const mappedInsurance = parsedRows.map((row, idx) => {
          const name = String(row['Name'] || row['اسم الموظف'] || `Insured ${idx + 1}`).trim();
          const natId = String(row['ID.'] || row['ID'] || row['الرقم القومي'] || '').trim();
          const dept = String(row['Department'] || row['القسم'] || 'HR').trim();
          const insNum = String(row['Insurance Number'] || row['الرقم التأميني'] || `${300000 + idx}`).trim();
          const salary = Number(row['Insurance Salary'] || row['الأجر التأميني']) || 4325.00;
          const worker = Number(row['Worker'] || row['حصة العامل']) || 475.85;
          const company = Number(row['Company'] || row['حصة الشركة']) || 811.13;
          const note = String(row['Note'] || row['ملاحظات'] || '').trim();
          const listStatus = String(row['Employee List Status'] || row['حالة المطابقة'] || '').toLowerCase();
          const isNotFound = listStatus.includes('not') || listStatus.includes('غير');

          return {
            serialNo: idx + 1,
            nationalId: natId,
            employeeName: name,
            department: dept,
            insuranceNumber: insNum,
            insuranceSalary: salary,
            workerShare: worker,
            companyShare: company,
            totalContribution: worker + company,
            note,
            employeeListStatus: (isNotFound ? 'not_found' : 'found') as any,
          };
        });

        await insuranceService.importSocialInsurance(mappedInsurance, isOverwrite);
      }

      if (targetType === 'missing_documents') {
        const mappedMissing = parsedRows.map((row, idx) => {
          const name = String(row['Name'] || row['الاسم'] || `Employee ${idx + 1}`).trim();
          const natId = String(row['ID'] || row['الرقم القومي'] || '').trim();
          const dept = String(row['Department'] || row['القسم'] || 'HR').trim();
          const position = String(row['Position'] || row['الوظيفة'] || '').trim();
          const empCode = String(row['Employee ID'] || row['كود الموظف'] || '').trim();
          const start = String(row['Start date'] || row['تاريخ التعيين'] || '').trim();

          const qual = String(row['Qualification Certificate'] || row['شهادة المؤهل'] || '').toLowerCase().includes('miss') || String(row['Qualification Certificate'] || '').includes('ناقص') ? 'missing' : 'available';
          const birth = String(row['Birth Certificate'] || row['شهادة الميلاد'] || '').toLowerCase().includes('miss') || String(row['Birth Certificate'] || '').includes('ناقص') ? 'missing' : 'available';
          const id = String(row['ID Card'] || row['بطاقة الرقم القومي'] || '').toLowerCase().includes('miss') || String(row['ID Card'] || '').includes('ناقص') ? 'missing' : 'available';
          const cont = String(row['Contract'] || row['عقد العمل'] || '').toLowerCase().includes('miss') || String(row['Contract'] || '').includes('ناقص') ? 'missing' : 'available';

          return {
            serialNo: idx + 1,
            department: dept,
            employeeName: name,
            nationalId: natId,
            position,
            startDate: start,
            employeeCode: empCode,
            insuranceStatus: 'not_insured' as const,
            qualificationCert: qual as any,
            birthCert: birth as any,
            idCard: id as any,
            contract: cont as any,
            notes: String(row['Notes'] || row['ملاحظات'] || ''),
            status: (qual === 'missing' || birth === 'missing' || id === 'missing' || cont === 'missing') ? 'incomplete' as const : 'complete' as const,
          };
        });

        await insuranceService.importMissingDocuments(mappedMissing, isOverwrite);
      }

      success(t('excelImport.importSuccess'));
      if (onImportComplete) onImportComplete();
      onClose();
    } catch (err: any) {
      console.error(err);
      toastError(t('excelImport.saveError', { error: err.message || t('common.unknownError') }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('excelImport.modalTitle')}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            {t('excelImport.supportedFormats')}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleConfirmImport}
              isLoading={isProcessing}
              disabled={!parsedRows || parsedRows.length === 0}
            >
              {t('excelImport.confirmImport', { count: parsedRows.length })}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Step 1: Target Sheet Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-2">
            {t('excelImport.step1Label')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleTargetChange('employees')}
              className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-between ${
                targetType === 'employees'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#151D2E]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm">{t('excelImport.employeesSheetTitle')}</span>
                <Users className={`w-4 h-4 ${targetType === 'employees' ? 'text-brand-600 dark:text-[#38BDF8]' : 'text-slate-400'}`} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                {t('excelImport.employeesSheetDesc')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTargetChange('social_insurance')}
              className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-between ${
                targetType === 'social_insurance'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#151D2E]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm">{t('excelImport.insuranceSheetTitle')}</span>
                <ShieldCheck className={`w-4 h-4 ${targetType === 'social_insurance' ? 'text-brand-600 dark:text-[#38BDF8]' : 'text-slate-400'}`} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                {t('excelImport.insuranceSheetDesc')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTargetChange('missing_documents')}
              className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-between ${
                targetType === 'missing_documents'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#151D2E]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm">{t('excelImport.missingDocsSheetTitle')}</span>
                <FileCheck2 className={`w-4 h-4 ${targetType === 'missing_documents' ? 'text-brand-600 dark:text-[#38BDF8]' : 'text-slate-400'}`} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                {t('excelImport.missingDocsSheetDesc')}
              </p>
            </button>
          </div>
        </div>

        {/* Template Download Prompt */}
        <div className="bg-slate-50 dark:bg-[#111827]/70 border border-slate-200 dark:border-[#1E293B] rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">
                {t('excelImport.templatePromptTitle')}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                {t('excelImport.templatePromptDesc')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => handleDownloadTemplate(targetType)}
          >
            {t('excelImport.downloadTemplate')}
          </Button>
        </div>

        {/* Step 2: Upload Dropzone */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-2">
            {t('excelImport.step2Label')}
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              file
                ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-[#1E293B] hover:border-brand-500 dark:hover:border-brand-400 bg-slate-50/50 dark:bg-[#111827]/40 hover:bg-brand-50/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm block">{file.name}</span>
                  <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono">
                    {t('excelImport.readyToImport', { size: (file.size / 1024).toFixed(1) })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetState();
                    }}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  >
                    {t('excelImport.deleteAndReselect')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-[#38BDF8] flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm block">
                    {t('excelImport.dragAndDrop')}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    {t('excelImport.maxFileSize')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Parsed Preview & Statistics */}
        {parsedSummary && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-2">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-brand-600 dark:text-[#38BDF8]" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC] uppercase tracking-wider">
                  {t('excelImport.previewTitle', { count: parsedSummary.total })}
                </h4>
              </div>

              {/* Mode switch: Replace vs Append */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-[#94A3B8]">{t('excelImport.importMode')}</span>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as any)}
                  className="rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] px-2.5 py-1 text-xs text-slate-700 dark:text-[#F8FAFC] font-medium focus:ring-1 focus:ring-brand-500"
                >
                  <option value="replace">{t('excelImport.modeReplace')}</option>
                  <option value="append">{t('excelImport.modeAppend')}</option>
                </select>
              </div>
            </div>

            {/* Quick KPI badge bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-[#1E293B] rounded-lg p-2.5 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-[#94A3B8] block">{t('excelImport.totalRows')}</span>
                <span className="text-lg font-bold text-slate-800 dark:text-[#F8FAFC]">{parsedSummary.total}</span>
              </div>
              {parsedSummary.insuredCount !== undefined && parsedSummary.insuredCount > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-300 block">{t('excelImport.insuredCount')}</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{parsedSummary.insuredCount}</span>
                </div>
              )}
              {parsedSummary.notInsuredCount !== undefined && parsedSummary.notInsuredCount > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] uppercase font-semibold text-rose-700 dark:text-rose-300 block">{t('excelImport.notInsuredCount')}</span>
                  <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{parsedSummary.notInsuredCount}</span>
                </div>
              )}
              {parsedSummary.notFoundCount !== undefined && parsedSummary.notFoundCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-300 block">{t('excelImport.notFoundCount')}</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{parsedSummary.notFoundCount}</span>
                </div>
              )}
            </div>

            {/* Live rows preview table */}
            <div className="max-h-56 overflow-auto border border-slate-200 dark:border-[#1E293B] rounded-xl bg-white dark:bg-[#151D2E] text-xs">
              <table className="w-full text-left rtl:text-right border-collapse">
                <thead className="bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-300 sticky top-0 font-semibold border-b border-slate-200 dark:border-[#1E293B]">
                  <tr>
                    {Object.keys(parsedRows[0] || {}).slice(0, 6).map((col) => (
                      <th key={col} className="p-2 border-l border-slate-200 dark:border-[#1E293B] last:border-l-0 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {parsedRows.slice(0, 6).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors">
                      {Object.keys(parsedRows[0] || {}).slice(0, 6).map((col) => (
                        <td key={col} className="p-2 border-l border-slate-100 dark:border-[#1E293B] last:border-l-0 whitespace-nowrap">
                          {String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
              {t('excelImport.previewNotice', { count: parsedRows.length })}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
