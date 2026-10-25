import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  Search,
  User,
  Calendar,
  CreditCard,
  Building2,
  Briefcase,
  MapPin,
  CheckCircle2,
  Download,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useEmployees } from '../../../hooks/queries';
import { Employee } from '../../../types';
import { useTranslation } from 'react-i18next';
import { numberToArabicWords } from '../../../lib/tafqeet';
import {
  generateFilledSalarySlip,
  generateFilledClearanceForm,
  generateFilledResignationForm,
  formatToEgyptianDate,
} from '../services/docxAutoFillService';

interface EmployeeTemplateFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: 'salary-slip-template' | 'clearance-form' | 'resignation-form';
  templateTitleAr: string;
  initialEmployee?: Employee | null;
}

export const EmployeeTemplateFillModal: React.FC<EmployeeTemplateFillModalProps> = ({
  isOpen,
  onClose,
  templateId,
  templateTitleAr,
  initialEmployee = null,
}) => {
  const { t } = useTranslation();
  // Query all active employees
  const { data: employeesResponse, isLoading: isLoadingEmployees } = useEmployees({
    pageSize: 500,
  });
  const employees: Employee[] = employeesResponse?.data || [];

  // Employee Selection State
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(initialEmployee);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form Fields State
  const [employeeName, setEmployeeName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [address, setAddress] = useState('');
  const [salary, setSalary] = useState<number>(10000);
  const [salaryWords, setSalaryWords] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [resignationDate, setResignationDate] = useState('');
  const [issueDate, setIssueDate] = useState('');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial employee if provided
  useEffect(() => {
    if (initialEmployee) {
      handleSelectEmployee(initialEmployee);
    } else {
      // Default dates
      const todayIso = new Date().toISOString().split('T')[0];
      setIssueDate(todayIso);
      setResignationDate(todayIso);
    }
  }, [initialEmployee, isOpen]);

  // When an employee is chosen, pre-fill all relevant fields
  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDropdownOpen(false);
    setEmployeeSearch('');
    setSuccessMessage(null);
    setErrorMessage(null);

    const name = emp.arabicName || `${emp.firstName} ${emp.lastName}`.trim();
    setEmployeeName(name);
    setNationalId(emp.nationalId || '');
    setJobTitle(emp.positionTitle || '');
    setDepartment(emp.departmentName || '');
    setAddress(emp.address || 'محافظة الدقهلية - المنصورة');

    // Calculate total salary or basic salary
    const totalSalary = (emp.basicSalary || 0) + (emp.housingAllowance || 0) + (emp.transportAllowance || 0);
    const finalSalary = totalSalary > 0 ? totalSalary : emp.basicSalary || 10000;
    setSalary(finalSalary);
    setSalaryWords(numberToArabicWords(finalSalary));

    setHireDate(emp.hireDate ? emp.hireDate.split('T')[0] : '');
    const todayIso = new Date().toISOString().split('T')[0];
    setIssueDate(todayIso);
    setResignationDate(emp.resignationDate ? emp.resignationDate.split('T')[0] : todayIso);
  };

  // Keep salary words in sync with salary changes
  const handleSalaryChange = (val: number) => {
    setSalary(val);
    setSalaryWords(numberToArabicWords(val));
  };

  // Filtered employees for dropdown search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees.slice(0, 8);
    const q = employeeSearch.toLowerCase();
    return employees
      .filter(
        emp =>
          (emp.arabicName && emp.arabicName.toLowerCase().includes(q)) ||
          `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
          emp.nationalId.includes(q) ||
          emp.employeeId.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [employees, employeeSearch]);

  const handleGenerate = async () => {
    if (!employeeName.trim()) {
      setErrorMessage('يرجى تحديد موظف أو إدخال اسم الموظف');
      return;
    }
    if (!nationalId.trim()) {
      setErrorMessage('يرجى إدخال الرقم القومي (14 رقم)');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);

      if (templateId === 'salary-slip-template') {
        await generateFilledSalarySlip({
          employeeName,
          nationalId,
          jobTitle,
          salary,
          salaryWords,
          hireDate,
          issueDate,
        });
      } else if (templateId === 'clearance-form') {
        await generateFilledClearanceForm({
          employeeName,
          nationalId,
          address,
          issueDate,
        });
      } else if (templateId === 'resignation-form') {
        await generateFilledResignationForm({
          employeeName,
          nationalId,
          department,
          jobTitle,
          hireDate,
          resignationDate,
          issueDate,
        });
      }

      setSuccessMessage(`تم توليد وتنزيل ملف Word بنجاح للموظف: ${employeeName}`);
      setTimeout(() => {
        // Auto close after 2.5s on success
        onClose();
        setSuccessMessage(null);
      }, 2500);
    } catch (err: any) {
      console.error('Error generating filled docx:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء إنشاء ملف Word');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#151D2E] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E293B] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1E293B] bg-gradient-to-r from-brand-50/80 to-white dark:from-[#1E293B]/70 dark:to-[#151D2E]">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-[#38BDF8] border border-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-lg">
                {t('employees.autoFillModalTitle', { title: templateTitleAr })}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('employees.autoFillModalDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Employee Selector Bar */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('employees.selectEmployeeLabel')}
            </label>

            <div className="relative">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder={selectedEmployee ? (selectedEmployee.arabicName || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`) : t('employees.searchPlaceholder')}
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] rounded-xl text-sm focus:bg-white dark:focus:bg-[#0B0F19] focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-brand-500/20 transition-all font-medium text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 pointer-events-none" />
                {selectedEmployee && !employeeSearch && (
                  <span className="absolute left-3">
                    <Badge variant="success" className="text-[10px]">
                      {t('common.verified')}
                    </Badge>
                  </span>
                )}
              </div>

              {/* Dropdown Results */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#151D2E] border border-slate-200 dark:border-[#1E293B] rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1E293B]">
                  {isLoadingEmployees ? (
                    <div className="p-4 text-center text-xs text-slate-400">{t('common.loading')}</div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">{t('common.noRecords')}</div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleSelectEmployee(emp)}
                        className="w-full text-right p-3 hover:bg-brand-50/60 dark:hover:bg-[#1E293B] transition-colors flex items-center justify-between gap-3 text-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-[#38BDF8] font-bold flex items-center justify-center text-xs shrink-0">
                            {emp.arabicName ? emp.arabicName[0] : emp.firstName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-[#F8FAFC] text-xs">
                              {emp.arabicName || `${emp.firstName} ${emp.lastName}`}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t('employees.nationalIdShort')}: {emp.nationalId} | {emp.departmentName}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {emp.positionTitle || '-'}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="bg-slate-50/70 dark:bg-[#0B0F19]/50 border border-slate-200/80 dark:border-[#1E293B] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-[#1E293B] pb-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-brand-600 dark:text-[#38BDF8]" />
                {t('employees.extractedDataLabel')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('employees.extractedDataHint')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Employee Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-300">{t('employees.name')}:</label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-brand-500 font-bold text-slate-900 dark:text-[#F8FAFC]"
                  placeholder={t('employees.name')}
                />
              </div>

              {/* National ID */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-300">{t('employees.nationalId14')}:</label>
                <input
                  type="text"
                  maxLength={14}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-brand-500 font-mono font-bold text-slate-900 dark:text-[#F8FAFC]"
                  placeholder={t('employees.placeholderNationalId')}
                />
              </div>

              {/* Job Title */}
              {(templateId === 'salary-slip-template' || templateId === 'resignation-form') && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-300">{t('common.position')}:</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-brand-500 font-medium text-slate-900 dark:text-[#F8FAFC]"
                    placeholder={t('common.position')}
                  />
                </div>
              )}

              {/* Department */}
              {templateId === 'resignation-form' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-300">{t('common.department')}:</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-brand-500 font-medium text-slate-900 dark:text-[#F8FAFC]"
                    placeholder={t('common.department')}
                  />
                </div>
              )}

              {/* Address (Clearance) */}
              {templateId === 'clearance-form' && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-600 dark:text-slate-300">{t('employees.residentialAddress')}:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-brand-500 font-medium text-slate-900 dark:text-[#F8FAFC]"
                    placeholder={t('employees.placeholderAddress')}
                  />
                </div>
              )}

              {/* Salary Fields for Salary Slip */}
              {templateId === 'salary-slip-template' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 dark:text-slate-300">{t('employees.basicSalaryEgp')}:</label>
                    <input
                      type="number"
                      step={100}
                      value={salary}
                      onChange={(e) => handleSalaryChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-brand-500 font-bold text-slate-900 dark:text-[#F8FAFC]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 dark:text-slate-300">{t('employees.hireDate')}:</label>
                    <input
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-[#F8FAFC]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2 bg-emerald-50/80 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                    <label className="font-bold text-emerald-800 dark:text-emerald-300 block text-xs">
                      {t('employees.tafqeetArabic', 'التفقيط المعتمد باللغة العربية:')}
                    </label>
                    <input
                      type="text"
                      value={salaryWords}
                      onChange={(e) => setSalaryWords(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#0B0F19] border border-emerald-300 dark:border-emerald-700/60 rounded-lg font-bold text-emerald-900 dark:text-emerald-200 text-xs mt-1"
                    />
                  </div>
                </>
              )}

              {/* Dates for Resignation */}
              {templateId === 'resignation-form' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 dark:text-slate-300">{t('employees.hireDate')}:</label>
                    <input
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-[#F8FAFC]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 dark:text-slate-300">{t('employees.resignationDate', 'تاريخ الاستقالة / إنهاء العمل:')}</label>
                    <input
                      type="date"
                      value={resignationDate}
                      onChange={(e) => setResignationDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-[#F8FAFC]"
                    />
                  </div>
                </>
              )}

              {/* Issue Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-300">{t('common.date')}:</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-[#F8FAFC]"
                />
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-[#111827]/70 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isGenerating}>
            {t('common.cancel')}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || !employeeName}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 px-5"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('employees.generatingWordDoc')}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t('employees.generateAndDownloadWord')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
