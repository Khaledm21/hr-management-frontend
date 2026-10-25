import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  Building2,
  User,
  CreditCard,
  MapPin,
  Calendar,
  Briefcase,
  AlertCircle,
  X,
  FileDown,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Employee, SocialInsuranceRecord } from '../../../types';
import { useCompany } from '../../../context/CompanyContext';
import { parseEgyptianNationalId } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';

interface InsuranceForm1GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  insuranceRecord?: SocialInsuranceRecord | null;
}

export const InsuranceForm1GuideModal: React.FC<InsuranceForm1GuideModalProps> = ({
  isOpen,
  onClose,
  employee,
  insuranceRecord,
}) => {
  const { settings, companyName } = useCompany();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  // Resolved Data
  const nid = employee?.nationalId || insuranceRecord?.nationalId || '';
  const parsedNid = parseEgyptianNationalId(nid);
  const nameAr =
    employee?.arabicName ||
    insuranceRecord?.employeeName ||
    (employee ? `${employee.firstName} ${employee.lastName}`.trim() : '');
  const nameEn = employee ? `${employee.firstName} ${employee.lastName}`.trim() : '';
  const insNo = employee?.insuranceNumber || insuranceRecord?.insuranceNumber || '';
  const jobTitle = employee?.positionTitle || employee?.chinesePosition || '';
  const hireDate = employee?.hireDate || (insuranceRecord?.note?.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '');
  const phone = employee?.phone || '';
  const address = employee?.address || '';

  const estNumber = '2970938';
  const officeName = 'تأمينات بلقاس';
  const companyOfficialName =
    companyName || settings.companyNameAr || 'شركة نيو هوب للتنمية الزراعية (مصر) ش.م.م';
  const companyAddress = 'قطعة 5 - بلوك أ - مرحلة 4 - المنطقة الصناعية - جمصة';
  const insuranceSalary = '4900';
  const grossSalary = '7000';
  const jobCode = '2141';

  // Format Hire Date into Day / Month / Year
  let hireDay = '--';
  let hireMonth = '--';
  let hireYear = '----';
  if (hireDate) {
    const parts = hireDate.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        hireYear = parts[0];
        hireMonth = parts[1].padStart(2, '0');
        hireDay = parts[2].padStart(2, '0');
      } else {
        hireDay = parts[0].padStart(2, '0');
        hireMonth = parts[1].padStart(2, '0');
        hireYear = parts[2];
      }
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllSummary = () => {
    const summary = `
=== بيانات استمارة (1) تأمينات اجتماعية ===
• اسم الموظف: ${nameAr || nameEn}
• الرقم القومي: ${nid || 'غير مسجل'}
• الرقم التأميني: ${insNo || 'غير مسجل'}
• تاريخ بدء العمل: ${hireDay}/${hireMonth}/${hireYear}
• كود المهنة: ${jobCode}
• المسمى الوظيفي: ${jobTitle}
• المؤهل الدراسي: مؤهل عالي
• القطاع: خاص
• أجر / دخل الاشتراك: ${insuranceSalary} ج.م
• الأجر الشامل: ${grossSalary} ج.م
• الأجر الأساسي: فارغ
• رقم المنشأة: ${estNumber}
• اسم المنشأة: ${companyOfficialName}
• مكتب التأمينات: ${officeName}
• عنوان المنشأة: ${companyAddress}
• تليفون الموظف: ${phone || 'غير مسجل'}
• عنوان الموظف: ${address || 'غير مسجل'}
=========================================
`.trim();
    navigator.clipboard.writeText(summary);
    setCopiedKey('all');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePrintBlankForm = () => {
    // Open the official blank PDF in a new window to print with full quality
    window.open('/templates/form1_insurance.pdf', '_blank');
  };

  const handleDownloadBlankPdf = () => {
    const a = document.createElement('a');
    a.href = '/templates/form1_insurance.pdf';
    a.download = 'نموذج_رقم_1_تأمينات_اجتماعية_فارغ.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#151D2E] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E293B] overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 dark:from-[#0B0F19] dark:via-[#111827] dark:to-[#0B0F19] text-white flex items-center justify-between border-b border-slate-800 dark:border-[#1E293B]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  دليل تعبئة استمارة رقم (1) تأمينات اجتماعية
                </h3>
                <span className="text-[11px] bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  س1 - التحاق بالعمل
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                بيانات الموظف والمنشأة مجهزة بالكامل ومطابقة للدفتر الحكومي للنقل اليدوي بالقلم الجاف
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={copiedKey === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={copyAllSummary}
              className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white text-xs font-semibold"
            >
              {copiedKey === 'all' ? 'تم نسخ الكل!' : 'نسخ كل البيانات'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5 text-brand-400" />}
              onClick={handlePrintBlankForm}
              className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white text-xs font-semibold"
              title="طباعة نموذج استمارة 1 الحكومي فارغاً بجودة كاملة"
            >
              طباعة استمارة فارغة
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileDown className="w-3.5 h-3.5 text-emerald-400" />}
              onClick={handleDownloadBlankPdf}
              className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white text-xs font-semibold"
              title="تحميل ملف الـ PDF الحكومي الأصلي فارغاً"
            >
              تحميل PDF فارغ
            </Button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 px-6 py-2.5 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 transition-colors">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>طريقة الاستخدام:</strong> أمسك دفتر التأمينات والقلم الجاف الأزرق وانقل القيم الموضحة أدناه خانة بخانة. كل قيمة بجانبها زر نسخ سريع.
            </span>
          </div>
          <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded">
            مكتب {officeName}
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-[#0B0F19] transition-colors">
          
          {/* SECTION 1: بيانات المنشأة ومكتب التأمينات */}
          <div className="bg-white dark:bg-[#151D2E] rounded-xl border border-slate-200/90 dark:border-[#1E293B] shadow-sm p-5 space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>أولاً: بيانات المنشأة ومكتب التأمينات (الوجه الأول والإقرار)</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">ثابتة لكل موظفي الشركة</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* رقم المنشأة */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>رقم المنشأة (8 خانات)</span>
                  <button
                    onClick={() => copyToClipboard(estNumber, 'estNumber')}
                    className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                    title="نسخ"
                  >
                    {copiedKey === 'estNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-mono text-lg font-black text-brand-700 dark:text-brand-400 tracking-wider">
                  {estNumber}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">في الـ 8 مربعات على اليمين</span>
              </div>

              {/* مكتب التأمينات */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>مكتب التأمينات التابع</span>
                  <button
                    onClick={() => copyToClipboard(officeName, 'officeName')}
                    className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                    title="نسخ"
                  >
                    {copiedKey === 'officeName' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {officeName}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">أعلى يمين الاستمارة</span>
              </div>

              {/* اسم المنشأة */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] col-span-1 md:col-span-2 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>اسم المنشأة الرسمي</span>
                  <button
                    onClick={() => copyToClipboard(companyOfficialName, 'companyName')}
                    className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                    title="نسخ"
                  >
                    {copiedKey === 'companyName' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">
                  {companyOfficialName}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">سطر اسم المنشأة بالوجهين</span>
              </div>

              {/* عنوان المنشأة */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] col-span-1 md:col-span-2 lg:col-span-4 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>عنوان المنشأة (في صفحة الإقرار بالخلف)</span>
                  <button
                    onClick={() => copyToClipboard(companyAddress, 'companyAddress')}
                    className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                    title="نسخ"
                  >
                    {copiedKey === 'companyAddress' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {companyAddress}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: بيانات المؤمن عليه (الموظف) */}
          <div className="bg-white dark:bg-[#151D2E] rounded-xl border border-slate-200/90 dark:border-[#1E293B] shadow-sm p-5 space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>ثانياً: بيانات المؤمن عليه (الموظف الحالي)</span>
              </div>
              <span className="font-mono text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded font-bold">
                {employee?.employeeId || 'EMP'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* اسم الموظف */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>اسم المؤمن عليه (رباعي)</span>
                  <button
                    onClick={() => copyToClipboard(nameAr || nameEn, 'empName')}
                    className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                    title="نسخ"
                  >
                    {copiedKey === 'empName' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {nameAr || nameEn || '-'}
                </div>
                {nameEn && nameAr && (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{nameEn}</div>
                )}
              </div>

              {/* الرقم القومي */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>الرقم القومي (14 خانة)</span>
                  <button
                    onClick={() => copyToClipboard(nid, 'nid')}
                    className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                    title="نسخ"
                  >
                    {copiedKey === 'nid' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-[#F8FAFC] tracking-wider">
                  {nid || 'غير مسجل'}
                </div>
                {parsedNid?.governorateName && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                    محافظة الميلاد: {parsedNid.governorateName} (كود {parsedNid.governorateCode})
                  </span>
                )}
              </div>

              {/* الرقم التأميني */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>الرقم التأميني (إن وجد)</span>
                  {insNo && (
                    <button
                      onClick={() => copyToClipboard(insNo, 'insNo')}
                      className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                      title="نسخ"
                    >
                      {copiedKey === 'insNo' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <div className="font-mono text-sm font-bold text-brand-700 dark:text-brand-400">
                  {insNo || 'طلب اشتراك جديد'}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  {insNo ? 'رقم تأميني معتمد' : 'يترك فارغاً لو أول مرة تأمين'}
                </span>
              </div>

              {/* كود المهنة والمسمى */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>كود المهنة + المسمى</span>
                  <button
                    onClick={() => copyToClipboard(jobTitle, 'jobTitle')}
                    className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                    title="نسخ المسمى"
                  >
                    {copiedKey === 'jobTitle' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center justify-between">
                  <span>المسمى: {jobTitle || '-'}</span>
                  <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">{jobCode}</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  يكتب المسمى بجانب كود المهنة وباقي المسميات فارغة
                </span>
              </div>

              {/* تاريخ بدء الاشتراك (التعيين) */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>تاريخ بدء الاشتراك (التعيين)</span>
                  <button
                    onClick={() => copyToClipboard(`${hireDay}/${hireMonth}/${hireYear}`, 'hireDate')}
                    className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                    title="نسخ"
                  >
                    {copiedKey === 'hireDate' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {hireDay} / {hireMonth} / {hireYear}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">يوم / شهر / سنة في المربعات المخصصة</span>
              </div>

              {/* المؤهل والجنسية */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">المؤهل والجنسية</div>
                <div className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center justify-between">
                  <span>المؤهل: مؤهل عالي</span>
                  <span className="text-slate-600 dark:text-slate-300">الجنسية: مصري</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">تكتب على الأسطر المنقطة</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: الأجور وقيم الاشتراك */}
          <div className="bg-white dark:bg-[#151D2E] rounded-xl border border-slate-200/90 dark:border-[#1E293B] shadow-sm p-5 space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>ثالثاً: الأجور والقطاع وقيم الاشتراك المعتمدة</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">وفقاً لقانون التأمينات الاجتماعية</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* دخل الاشتراك */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 transition-colors">
                <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 mb-1 font-semibold">
                  <span>*أجر / دخل الاشتراك</span>
                  <button
                    onClick={() => copyToClipboard(insuranceSalary, 'insSal')}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200"
                    title="نسخ"
                  >
                    {copiedKey === 'insSal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-mono text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {insuranceSalary} <span className="text-xs font-normal">ج.م</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  جنيه: <strong>4900</strong> • قرش: <strong>00</strong>
                </span>
              </div>

              {/* الأجر الشامل */}
              <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/50 transition-colors">
                <div className="flex items-center justify-between text-xs text-blue-800 dark:text-blue-300 mb-1 font-semibold">
                  <span>*الأجر الشامل (تأمين صحي)</span>
                  <button
                    onClick={() => copyToClipboard(grossSalary, 'grossSal')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    title="نسخ"
                  >
                    {copiedKey === 'grossSal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-mono text-xl font-black text-blue-700 dark:text-blue-400">
                  {grossSalary} <span className="text-xs font-normal">ج.م</span>
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-0.5">
                  جنيه: <strong>7000</strong> • قرش: <strong>00</strong>
                </span>
              </div>

              {/* الأجر الأساسي */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3.5 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">*أجر أساسي</div>
                <div className="text-base font-bold text-slate-400 dark:text-slate-500 line-through">
                  فارغ تماماً
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  يترك فارغاً (المربعات فارغة)
                </span>
              </div>

              {/* القطاع */}
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3.5 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">القطاع والمربع المجاور</div>
                <div className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                  خاص <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">| والمربع [ ] فارغ</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  نوع المدد وكود الاشتراك يتركان فارغين
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: العنوان والتوقيعات والإقرار */}
          <div className="bg-white dark:bg-[#151D2E] rounded-xl border border-slate-200/90 dark:border-[#1E293B] shadow-sm p-5 space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>رابعاً: العنوان والتوقيعات والإقرار</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">بيانات التواصل والإقرار</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] space-y-1.5 transition-colors">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>عنوان إقامة الموظف (شارع / حارة):</span>
                  {address && (
                    <button
                      onClick={() => copyToClipboard(address, 'addr')}
                      className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                      title="نسخ"
                    >
                      {copiedKey === 'addr' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{address || 'جمصة - محافظة الدقهلية'}</div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-[#1E293B] text-slate-500 dark:text-slate-400">
                  <span>رقم تليفون الموظف:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{phone || '-'}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] space-y-1.5 transition-colors">
                <div className="font-bold text-slate-800 dark:text-[#F8FAFC]">التوقيعات المطلوبة على الاستمارة:</div>
                <div className="text-slate-600 dark:text-slate-300 space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600"></span>
                    <span><strong>توقيع صاحب العمل / المدير المسئول:</strong> يترك فارغاً للتوقيع والختم اليدوي.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600"></span>
                    <span><strong>توقيع المؤمن عليه:</strong> يوقع العامل بيده بالقلم الجاف.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600"></span>
                    <span><strong>إقرار العامل (بالخلف):</strong> يكتب اسم العامل: <strong className="text-brand-700 dark:text-brand-400">{nameAr || nameEn}</strong>.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-[#151D2E] border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-between transition-colors">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>يمكنك دائماً طباعة الاستمارة الحكومية الفارغة من هنا وتعبئتها يدوياً بكل سهولة وبدون أي أخطاء.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrintBlankForm}
            >
              طباعة استمارة فارغة (A4)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="bg-brand-600 hover:bg-brand-500 font-bold px-5"
            >
              إغلاق
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
