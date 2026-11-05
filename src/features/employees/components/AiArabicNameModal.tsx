import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  KeyRound,
  RefreshCw,
  RotateCcw,
  BookOpen,
  Save,
  Check,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { aiService } from '../../../services/aiService';
import { employeeService } from '../../../services/employeeService';
import { transliterateEnglishNameToArabic } from '../../../utils/arabicNameTransliteration';
import { Employee } from '../../../types';
import { cn } from '../../../lib/utils';

interface AiArabicNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onSuccess: (updates?: Array<{ id: string; arabicName: string }>) => void;
}

interface TranslationItem {
  id: string;
  employeeId?: string;
  englishName: string;
  arabicName: string;
  isModified?: boolean;
}

export const AiArabicNameModal: React.FC<AiArabicNameModalProps> = ({
  isOpen,
  onClose,
  employees,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [apiKey, setApiKey] = useState<string>(aiService.getApiKey());
  const [showApiKeySettings, setShowApiKeySettings] = useState<boolean>(!aiService.hasApiKey());
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [previewList, setPreviewList] = useState<TranslationItem[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [hasTranslated, setHasTranslated] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Identify candidates: employees whose arabicName is missing or identical to their english fullName
  const candidates = useMemo(() => {
    return employees
      .filter(e => {
        const fullEn = `${e.firstName || ''} ${e.lastName || ''}`.trim();
        const ar = (e.arabicName || '').trim();
        return !ar || ar.toLowerCase() === fullEn.toLowerCase();
      })
      .map(e => ({
        id: e.id,
        employeeId: e.employeeId,
        englishName: `${e.firstName || ''} ${e.lastName || ''}`.trim(),
        arabicName: '',
      }));
  }, [employees]);

  useEffect(() => {
    if (isOpen) {
      setApiKey(aiService.getApiKey());
      setShowApiKeySettings(!aiService.hasApiKey());
      setPreviewList(candidates);
      setHasTranslated(false);
      setSearchFilter('');
    }
  }, [isOpen, candidates]);

  const handleSaveApiKey = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      toastError(t('employees.aiTranslateKeyRequired', 'يرجى إدخال مفتاح Gemini API'));
      return;
    }
    aiService.setApiKey(trimmed);
    setApiKey(trimmed);
    setShowApiKeySettings(false);
    toastSuccess(t('employees.aiTranslateKeySaved', 'تم حفظ مفتاح Gemini API بنجاح'));
  };

  const handleStartTranslation = async () => {
    if (!aiService.hasApiKey()) {
      setShowApiKeySettings(true);
      toastInfo(t('employees.aiTranslateKeyPrompt'));
      return;
    }

    if (previewList.length === 0) {
      toastInfo(t('employees.aiTranslateAllDone'));
      return;
    }

    setIsTranslating(true);
    setProgress({ current: 0, total: previewList.length, percent: 0 });
    try {
      const res = await aiService.translateEmployeeNamesToAr(
        previewList.map(p => ({
          id: p.id,
          employeeId: p.employeeId,
          englishName: p.englishName,
        })),
        p => setProgress(p)
      );

      if (!res.success) {
        if (res.error === 'NO_API_KEY') {
          setShowApiKeySettings(true);
          toastError(t('employees.aiTranslateKeyPrompt'));
        } else {
          toastError(res.error || t('common.error'));
        }
        return;
      }

      setPreviewList(res.results.map(r => ({ ...r, isModified: false })));
      setHasTranslated(true);
      toastSuccess(
        t('employees.aiTranslateSuccessCount', {
          count: res.results.length,
          defaultValue: `تم تعريب ${res.results.length} اسماً بنجاح! راجع الأسماء واعتمد الحفظ.`,
        })
      );
    } catch (err: any) {
      console.error('Translation failed', err);
      toastError(err?.message || t('common.error'));
    } finally {
      setIsTranslating(false);
      setProgress(null);
    }
  };

  const handleArabicNameChange = (id: string, newName: string) => {
    setPreviewList(prev =>
      prev.map(item => (item.id === id ? { ...item, arabicName: newName, isModified: true } : item))
    );
  };

  const handleInstantCivilRegistryTransliteration = () => {
    setPreviewList(prev =>
      prev.map(item => ({
        ...item,
        arabicName: transliterateEnglishNameToArabic(item.englishName),
        isModified: true,
      }))
    );
    setHasTranslated(true);
    toastSuccess(t('employees.civilRegistrySuccess', 'تم التعريب الفوري الدقيق لجميع الأسماء عبر السجل المدني'));
  };

  const handleSaveAndApply = async () => {
    const validItems = previewList.filter(item => item.arabicName && item.arabicName.trim().length > 0);
    if (validItems.length === 0) {
      toastError(t('employees.aiTranslateNoNamesToSave', 'لا توجد أسماء عربية مدخلة للحفظ'));
      return;
    }

    setIsSaving(true);
    try {
      const updates = validItems.map(item => ({
        id: item.id,
        arabicName: item.arabicName.trim(),
      }));
      const updatedCount = await employeeService.bulkUpdateArabicNames(updates);

      toastSuccess(t('employees.aiTranslateSuccess', { count: updatedCount }));
      onSuccess(updates);
      onClose();
    } catch (err: any) {
      console.error('Bulk update failed', err);
      toastError(err?.message || t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPreview = useMemo(() => {
    if (!searchFilter.trim()) return previewList;
    const q = searchFilter.toLowerCase().trim();
    return previewList.filter(
      item =>
        item.englishName.toLowerCase().includes(q) ||
        (item.employeeId && item.employeeId.toLowerCase().includes(q)) ||
        (item.arabicName && item.arabicName.includes(q))
    );
  }, [previewList, searchFilter]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <div className="space-y-5 text-start">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                {t('employees.aiTranslateTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('employees.aiTranslateSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Key Toggle Banner */}
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200 dark:border-[#1E293B]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Google Gemini API
              </span>
              {aiService.hasApiKey() ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> {t('common.active', 'مفعّل')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" /> {t('common.required', 'مطلوب')}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowApiKeySettings(!showApiKeySettings)}
              className="text-xs text-brand-600 dark:text-[#38BDF8] hover:underline font-semibold"
            >
              {showApiKeySettings ? t('common.close', 'إخفاء') : t('common.settings', 'إعداد المفتاح')}
            </button>
          </div>

          {showApiKeySettings && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Button size="sm" variant="primary" onClick={handleSaveApiKey}>
                  {t('common.save', 'حفظ')}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{t('employees.aiTranslateKeyHint', 'المفتاح يُحفظ محلياً في متصفحك بشكل آمن.')}</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 dark:text-[#38BDF8] inline-flex items-center gap-1 hover:underline"
                >
                  <span>Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Status / Candidates Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-50/50 dark:bg-brand-950/20 p-3 rounded-xl border border-brand-100 dark:border-brand-900/30">
          <div>
            <span className="text-xs font-bold text-brand-900 dark:text-brand-200 block">
              {candidates.length > 0
                ? t('employees.aiTranslateTotalFound', { count: candidates.length })
                : t('employees.aiTranslateAllDone')}
            </span>
            <span className="text-[11px] text-brand-700/80 dark:text-brand-300/80 mt-0.5 block">
              {hasTranslated
                ? t('employees.aiTranslateReviewHint', 'تم استلام الترجمات الذكية. يمكنك مراجعة أو تعديل أي اسم قبل الاعتماد.')
                : t('employees.aiTranslateStartHint', 'اضغط على زر البدء لترجمة جميع الأسماء بدقة عبر الذكاء الاصطناعي.')}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleInstantCivilRegistryTransliteration}
              disabled={candidates.length === 0 || isTranslating}
              className="text-xs font-bold border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 whitespace-nowrap"
            >
              {t('employees.instantCivilRegistryBtn', 'تعريب فوري بالسجل المدني')}
            </Button>

            {!hasTranslated ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={handleStartTranslation}
                isLoading={isTranslating}
                disabled={candidates.length === 0 || isTranslating}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-sm font-bold text-xs whitespace-nowrap"
              >
                {isTranslating ? t('employees.aiTranslateProcessing') : t('employees.aiTranslateStartBtn')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={handleStartTranslation}
                isLoading={isTranslating}
                className="text-xs font-semibold whitespace-nowrap"
              >
                {t('employees.aiTranslateRegenerate', 'إعادة التوليد بالـ AI')}
              </Button>
            )}
          </div>
        </div>

        {/* Live Progress Bar when Translating */}
        {isTranslating && progress && (
          <div className="space-y-1.5 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
            <div className="flex justify-between items-center text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {t('employees.aiTranslateProcessingProgress', {
                    current: progress.current,
                    total: progress.total,
                    defaultValue: `جاري تعريب ${progress.current} من أصل ${progress.total} موظف...`,
                  })}
                </span>
              </span>
              <span className="font-mono">{progress.percent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Search bar inside modal if list has items */}
        {previewList.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder={t('employees.searchPlaceholder', 'بحث بالاسم أو الكود...')}
              className="w-full text-xs ps-9 pe-3 py-2 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#151D2E] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* Table of Candidates / Results */}
        <div className="max-h-[380px] overflow-y-auto border border-slate-200 dark:border-[#1E293B] rounded-xl">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-[#1E293B]">
              <tr>
                <th className="p-2.5 w-10 text-center">#</th>
                <th className="p-2.5 w-24">{t('employees.empId', 'الكود')}</th>
                <th className="p-2.5">{t('employees.englishName', 'الاسم بالإنجليزي')}</th>
                <th className="p-2.5">{t('employees.arabicName', 'الاسم بالعربي المقترح')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
              {filteredPreview.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    {t('common.noData', 'لا توجد بيانات')}
                  </td>
                </tr>
              ) : (
                filteredPreview.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-2.5 text-center font-mono text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="p-2.5">
                      <span className="font-mono font-semibold text-brand-700 dark:text-[#38BDF8] bg-brand-50/70 dark:bg-brand-950/40 px-2 py-0.5 rounded text-[11px]">
                        {item.employeeId || '-'}
                      </span>
                    </td>
                    <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                      {item.englishName}
                    </td>
                    <td className="p-2.5">
                      <div className="relative flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={item.arabicName}
                            onChange={e => handleArabicNameChange(item.id, e.target.value)}
                            placeholder={
                              hasTranslated
                                ? t('employees.arabicName', 'اكتب الاسم بالعربي...')
                                : t('employees.pendingTranslation', 'في انتظار التعريب...')
                            }
                            className={cn(
                              'w-full text-xs px-2.5 py-1.5 pe-7 rounded-lg border font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500',
                              item.arabicName
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                                : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] text-slate-400'
                            )}
                          />
                          {item.arabicName && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleArabicNameChange(item.id, transliterateEnglishNameToArabic(item.englishName))}
                          title={t('employees.restoreCivilRegistry', 'استعادة الاسم الأصلي من السجل المدني')}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {hasTranslated && (
              <span>
                {t('employees.readyToSaveCount', {
                  count: previewList.filter(p => p.arabicName?.trim()).length,
                  defaultValue: `جاهز للاعتماد: ${previewList.filter(p => p.arabicName?.trim()).length} من أصل ${previewList.length}`,
                })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="md" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            {hasTranslated && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveAndApply}
                isLoading={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-sm"
              >
                {t('employees.aiTranslateSaveApply', {
                  count: previewList.filter(p => p.arabicName?.trim()).length,
                })}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

