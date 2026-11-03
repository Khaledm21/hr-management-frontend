import React, { useState } from 'react';
import {
  Sparkles,
  Briefcase,
  Layers,
  Award,
  CheckCircle2,
  Copy,
  RefreshCw,
  Plus,
  BookOpen,
  DollarSign,
  Globe,
  Sliders,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import { aiService, GeneratedJobSpec } from '../../../services/aiService';
import { useDepartments } from '../../../hooks/queries';

interface AiJobArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPosition?: (positionData: {
    code: string;
    title: string;
    titleAr: string;
    titleZh: string;
    departmentId: string;
    minSalary: string;
    maxSalary: string;
    level: string;
  }) => void;
}

export const AiJobArchitectModal: React.FC<AiJobArchitectModalProps> = ({
  isOpen,
  onClose,
  onApplyPosition,
}) => {
  const { success, error: toastError, info } = useToast();
  const { data: departments = [] } = useDepartments();

  const [titleInput, setTitleInput] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [level, setLevel] = useState('Mid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeLang, setActiveLang] = useState<'ar' | 'en' | 'zh'>('ar');
  const [spec, setSpec] = useState<GeneratedJobSpec | null>(null);

  const sampleTitles = [
    'سائق نقل وتوزيع',
    'فني صيانة ميكانيكية',
    'مترجم لغة صينية ومسؤول إداري',
    'مراقب جودة إنتاج',
    'محاسب تكاليف صناعية',
    'مهندس كهرباء وتحكم آلي',
    'أخصائي موارد بشرية وعلاقات عمل',
  ];

  const handleGenerate = async (targetTitle = titleInput) => {
    const finalTitle = targetTitle.trim();
    if (!finalTitle) {
      toastError('يرجى كتابة أو اختيار مسمى وظيفي أولاً');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedDept = departments.find((d) => d.id === departmentId)?.name || 'العمليات والإنتاج';
      const result = await aiService.generateJobDescription({
        title: finalTitle,
        department: selectedDept,
        level,
      });

      setSpec(result);
      success('تم توليد الوصف الوظيفي ومؤشرات الأداء (KPIs) بنجاح!');
    } catch (err: any) {
      toastError(err?.message || 'حدث خطأ أثناء التوليد بالذكاء الاصطناعي');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    success('تم نسخ النص إلى الحافظة');
  };

  const handleSaveToPositions = () => {
    if (!spec || !onApplyPosition) return;

    // Generate smart code like POS-DRIVER-01
    const prefix = spec.titleEn
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'POS';
    const randNum = Math.floor(10 + Math.random() * 90);
    const code = `${prefix}-${randNum}`;

    onApplyPosition({
      code,
      title: spec.titleEn,
      titleAr: spec.titleAr,
      titleZh: spec.titleZh,
      departmentId: departmentId || departments[0]?.id || '',
      minSalary: String(spec.suggestedSalaryRange?.min || '5000'),
      maxSalary: String(spec.suggestedSalaryRange?.max || '10000'),
      level,
    });

    success('تم إضافة المسمى وتفاصيله بنجاح إلى النظام!');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="مساعد صياغة الأوصاف الوظيفية والـ KPIs الذكي (AI Job Architect)"
      size="2xl"
    >
      <div className="space-y-5">
        {/* Top Generator Form */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 animate-pulse" />
            <span>حدد معايير الوظيفة لتوليد المهام والـ KPIs والترجمات الثلاثية فوراً</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                المسمى الوظيفي
              </label>
              <Input
                placeholder="مثال: مهندس صيانة ميكانيكية..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                القسم / الإدارة
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-brand-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameAr || d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                المستوى الوظيفي
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-brand-500"
              >
                <option value="Junior">مبتدئ (Junior)</option>
                <option value="Mid">متوسط (Mid-Level)</option>
                <option value="Senior">أول / خبير (Senior)</option>
                <option value="Lead">رئيس قسم / مسؤول (Lead)</option>
                <option value="Manager">مدير إدارة (Manager)</option>
              </select>
            </div>
          </div>

          {/* Quick Selection Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-400">اقتراحات سريعة:</span>
            {sampleTitles.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTitleInput(t);
                  handleGenerate(t);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 transition-colors font-medium text-slate-600 dark:text-slate-300 shadow-2xs"
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !titleInput.trim()}
              className="text-xs bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2 px-5 py-2 shadow-xs"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'جاري الصياغة بالذكاء الاصطناعي...' : 'توليد الوصف الوظيفي الآن ✨'}</span>
            </Button>
          </div>
        </div>

        {/* Results Preview */}
        {spec && (
          <div className="space-y-4 animate-in fade-in">
            {/* Header: Titles in 3 Languages */}
            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {spec.titleAr}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span>{spec.titleEn}</span>
                      <span>•</span>
                      <span className="text-brand-600 dark:text-brand-400 font-semibold">{spec.titleZh}</span>
                    </div>
                  </div>
                </div>

                {spec.suggestedSalaryRange && (
                  <Badge variant="brand" size="md" className="flex items-center gap-1 text-xs">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>
                      الراتب المقترح: {spec.suggestedSalaryRange.min.toLocaleString()} -{' '}
                      {spec.suggestedSalaryRange.max.toLocaleString()} ج.م
                    </span>
                  </Badge>
                )}
              </div>

              {/* Language Switcher Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveLang('ar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeLang === 'ar'
                        ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    العربية 🇪🇬
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLang('en')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeLang === 'en'
                        ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    English 🇬🇧
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLang('zh')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeLang === 'zh'
                        ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    中文 (الصينية) 🇨🇳
                  </button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const content =
                      activeLang === 'ar'
                        ? `${spec.titleAr}\n${spec.summaryAr}\n\nالمهام:\n${spec.responsibilitiesAr.join('\n')}\n\nمؤشرات الأداء:\n${spec.kpisAr.join('\n')}`
                        : activeLang === 'en'
                        ? `${spec.titleEn}\n${spec.summaryEn}\n\nResponsibilities:\n${spec.responsibilitiesEn.join('\n')}\n\nKPIs:\n${spec.kpisEn.join('\n')}`
                        : `${spec.titleZh}\n${spec.summaryZh}\n\n职责:\n${spec.responsibilitiesZh.join('\n')}\n\nKPI:\n${spec.kpisZh.join('\n')}`;
                    handleCopy(content);
                  }}
                  className="text-xs flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ المحتوى</span>
                </Button>
              </div>

              {/* Dynamic Content Based on Active Language */}
              <div className="space-y-4 pt-2 text-xs">
                {/* Summary */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {activeLang === 'ar' ? 'الهدف العام من الوظيفة' : activeLang === 'en' ? 'Job Purpose' : '岗位宗旨与概述'}
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    {activeLang === 'ar' ? spec.summaryAr : activeLang === 'en' ? spec.summaryEn : spec.summaryZh}
                  </p>
                </div>

                {/* Grid: Responsibilities & KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Responsibilities */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      {activeLang === 'ar' ? 'المهام والمسؤوليات الرئيسية' : activeLang === 'en' ? 'Key Responsibilities' : '主要岗位职责'}
                    </span>
                    <ul className="space-y-2 pt-1 text-slate-700 dark:text-slate-200">
                      {(activeLang === 'ar'
                        ? spec.responsibilitiesAr
                        : activeLang === 'en'
                        ? spec.responsibilitiesEn
                        : spec.responsibilitiesZh
                      ).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* KPIs */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      {activeLang === 'ar' ? 'مؤشرات قياس الأداء (KPIs)' : activeLang === 'en' ? 'Key Performance Indicators' : '关键绩效考核指标 (KPIs)'}
                    </span>
                    <ul className="space-y-2 pt-1 text-slate-700 dark:text-slate-200">
                      {(activeLang === 'ar'
                        ? spec.kpisAr
                        : activeLang === 'en'
                        ? spec.kpisEn
                        : spec.kpisZh
                      ).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Requirements */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {activeLang === 'ar' ? 'المؤهلات والشروط المطلوبة' : activeLang === 'en' ? 'Job Requirements' : '岗位任职要求'}
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(activeLang === 'ar'
                      ? spec.requirementsAr
                      : activeLang === 'en'
                      ? spec.requirementsEn
                      : spec.requirementsZh
                    ).map((req, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  إغلاق
                </Button>
                {onApplyPosition && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveToPositions}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة المسمى إلى دليل الوظائف</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

