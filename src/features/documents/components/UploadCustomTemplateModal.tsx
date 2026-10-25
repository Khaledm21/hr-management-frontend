import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { customTemplatesStorage, CustomFormTemplate } from '../services/customTemplatesStorage';

interface UploadCustomTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateAdded: (template: CustomFormTemplate) => void;
}

export const UploadCustomTemplateModal: React.FC<UploadCustomTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateAdded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileFormat, setFileFormat] = useState<'docx' | 'pdf' | 'xlsx'>('docx');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');

  // Form Fields
  const [titleAr, setTitleAr] = useState('');
  const [titleSecondary, setTitleSecondary] = useState('');
  const [category, setCategory] = useState<CustomFormTemplate['category']>('administrative');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const processFile = (file: File) => {
    setErrorMessage(null);

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 20 ميجابايت.');
      return;
    }

    // Determine format
    const ext = file.name.split('.').pop()?.toLowerCase();
    let detectedFormat: 'docx' | 'pdf' | 'xlsx' = 'docx';
    if (ext === 'pdf') detectedFormat = 'pdf';
    else if (ext === 'xlsx' || ext === 'xls') detectedFormat = 'xlsx';
    else if (ext === 'docx' || ext === 'doc') detectedFormat = 'docx';
    else {
      setErrorMessage('صيغة الملف غير مدعومة. يرجى رفع ملفات Word (.docx) أو PDF (.pdf) أو Excel (.xlsx).');
      return;
    }

    setSelectedFile(file);
    setFileFormat(detectedFormat);
    setFileSizeStr(formatFileSize(file.size));

    // Auto default Title from filename if not yet set
    if (!titleAr) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').trim();
      setTitleAr(cleanName);
    }

    // Read to Base64
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMessage('فشل قراءة الملف، يرجى المحاولة مرة أخرى.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const categoryLabels: Record<CustomFormTemplate['category'], string> = {
    administrative: 'شؤون إدارية وعامة',
    onboarding: 'التوظيف ومسوغات التعيين',
    assets: 'العهد والمخازن والأجهزة',
    payroll: 'الرواتب والشهادات المالية',
    resignation: 'إنهاء الخدمة والاستقالات',
    insurance: 'التأمينات الاجتماعية والحكومية',
    general: 'نماذج عامة ومراسلات',
  };

  const categoryColorSchemes: Record<CustomFormTemplate['category'], CustomFormTemplate['colorScheme']> = {
    administrative: {
      bg: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      border: 'hover:border-indigo-400',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      badgeText: 'text-indigo-700',
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    onboarding: {
      bg: 'from-teal-500/10 via-teal-500/5 to-transparent',
      border: 'hover:border-teal-400',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
      badgeText: 'text-teal-700',
      iconColor: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    assets: {
      bg: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
      border: 'hover:border-cyan-400',
      badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      badgeText: 'text-cyan-700',
      iconColor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    payroll: {
      bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      border: 'hover:border-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      badgeText: 'text-emerald-700',
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    resignation: {
      bg: 'from-amber-500/10 via-amber-500/5 to-transparent',
      border: 'hover:border-amber-400',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      badgeText: 'text-amber-700',
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    insurance: {
      bg: 'from-blue-500/10 via-blue-500/5 to-transparent',
      border: 'hover:border-blue-400',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      badgeText: 'text-blue-700',
      iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    general: {
      bg: 'from-slate-500/10 via-slate-500/5 to-transparent',
      border: 'hover:border-slate-400',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
      badgeText: 'text-slate-700',
      iconColor: 'text-slate-600 bg-slate-50 border-slate-200',
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileBase64) {
      setErrorMessage('يرجى اختيار ملف النموذج أولاً.');
      return;
    }
    if (!titleAr.trim()) {
      setErrorMessage('يرجى كتابة عنوان للنموذج بالعربية.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const parsedTags = tagsInput
        .split(/[,،]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const newTemplate: CustomFormTemplate = {
        id: `custom-tpl-${Date.now()}`,
        titleAr: titleAr.trim(),
        titleSecondary: titleSecondary.trim() || undefined,
        description: description.trim() || 'نموذج إداري مخصص تم رفعه إلى النظام لاستخدامه وطباعته.',
        originalFileName: selectedFile.name,
        downloadUrl: fileBase64,
        fileData: fileBase64,
        format: fileFormat,
        fileSize: fileSizeStr,
        category,
        categoryLabelAr: categoryLabels[category],
        tags: parsedTags.length > 0 ? parsedTags : ['مخصص', 'إداري'],
        lastUpdated: new Date().toISOString().split('T')[0],
        isCustom: true,
        colorScheme: categoryColorSchemes[category],
      };

      await customTemplatesStorage.save(newTemplate);
      onTemplateAdded(newTemplate);
      onClose();
    } catch (err: any) {
      console.error('Failed to save template:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ النموذج.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#151D2E] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E293B] w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1E293B] bg-gradient-to-r from-brand-50/80 to-white dark:from-[#1E293B]/70 dark:to-[#151D2E]">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-[#38BDF8] border border-brand-500/20">
              <UploadCloud className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-lg">
                إضافة نموذج أو مستند جديد للمكتبة
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ارفع أي نموذج Word أو PDF أو Excel لتخزينه واستخدامه وطباعته في أي وقت
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ملف النموذج (Word / PDF / Excel): <span className="text-rose-500">*</span>
            </label>

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-[#1E293B] hover:border-brand-500 dark:hover:border-[#38BDF8] bg-slate-50/70 dark:bg-[#0B0F19]/50 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-[#38BDF8] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC]">
                  اسحب وأفلت الملف هنا، أو <span className="text-brand-600 dark:text-[#38BDF8] underline">تصفح من جهازك</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  يدعم ملفات: docx, pdf, xlsx (الحد الأقصى: 20 ميجابايت)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-white dark:bg-[#151D2E] border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase shadow-sm">
                    {fileFormat}
                  </span>
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-[#F8FAFC] text-xs truncate max-w-xs">
                      {selectedFile.name}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      الحجم: {fileSizeStr}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileBase64('');
                  }}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  تغيير الملف
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,.pdf,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Title Arabic */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              عنوان النموذج بالعربية: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="مثال: إقرار استلام مسوغات التعيين، أو محضر تسليم عهدة"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] rounded-xl text-sm focus:bg-white dark:focus:bg-[#0B0F19] focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-brand-500/20 font-bold text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
          </div>

          {/* Secondary Title (Optional) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              العنوان الثانوي (إنجليزي أو صيني - اختياري):
            </label>
            <input
              type="text"
              value={titleSecondary}
              onChange={(e) => setTitleSecondary(e.target.value)}
              placeholder="Example: Appointment Documents Receipt Acknowledgement"
              dir="ltr"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] rounded-xl text-xs focus:bg-white dark:focus:bg-[#0B0F19] focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-brand-500/20 font-medium text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 text-left transition-all"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              تصنيف النموذج: <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] rounded-xl text-xs font-bold text-slate-800 dark:text-[#F8FAFC] focus:bg-white dark:focus:bg-[#0B0F19] focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
            >
              <option value="administrative">شؤون إدارية وعامة</option>
              <option value="onboarding">التوظيف ومسوغات التعيين</option>
              <option value="assets">العهد والمخازن والأجهزة</option>
              <option value="payroll">الرواتب والشهادات المالية</option>
              <option value="resignation">إنهاء الخدمة والاستقالات</option>
              <option value="insurance">التأمينات الاجتماعية والحكومية</option>
              <option value="general">نماذج عامة ومراسلات</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              وصف مختصر للنموذج:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب شرحاً موجزاً عن الغرض من النموذج وكيفية استخدامه..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] rounded-xl text-xs focus:bg-white dark:focus:bg-[#0B0F19] focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-brand-500/20 text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 transition-all leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              الكلمات الدلالية للبحث (مفصولة بفواصل):
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="مثال: عهدة, استلام, أجهزة, شؤون عاملين"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] rounded-xl text-xs focus:bg-white dark:focus:bg-[#0B0F19] focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-brand-500/20 text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#111827]/70 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedFile || !titleAr}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 px-6 font-bold"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                حفظ وإضافة النموذج للمكتبة
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
