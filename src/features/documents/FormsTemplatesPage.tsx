import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  FileDown,
  Sparkles,
  Layers,
  Tag,
  ExternalLink,
  Info,
  Clock,
  ShieldCheck,
  FileCheck,
  Briefcase,
  HelpCircle,
  X,
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  Plus,
  LayoutGrid,
  List,
  Filter,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { InsuranceForm1GuideModal } from '../insurance/components/InsuranceForm1GuideModal';
import { EmployeeTemplateFillModal } from './components/EmployeeTemplateFillModal';
import { UploadCustomTemplateModal } from './components/UploadCustomTemplateModal';
import { EmployeeBadgeModal } from '../employees/components/badge/EmployeeBadgeModal';
import { useEmployees } from '../../hooks/queries';
import { customTemplatesStorage, CustomFormTemplate } from './services/customTemplatesStorage';

export interface FormTemplate {
  id: string;
  titleAr: string;
  titleSecondary?: string;
  description: string;
  originalFileName: string;
  downloadUrl: string;
  fileData?: string;
  format: 'docx' | 'pdf' | 'xlsx';
  fileSize: string;
  category: 'resignation' | 'payroll' | 'insurance' | 'general' | 'administrative' | 'assets' | 'onboarding';
  categoryLabelAr: string;
  tags: string[];
  lastUpdated: string;
  isCustom?: boolean;
  colorScheme: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    iconColor: string;
  };
  hasGuideModal?: boolean;
}

export const FormsTemplatesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedTemplateForDetails, setSelectedTemplateForDetails] = useState<FormTemplate | null>(null);
  const [isForm1GuideOpen, setIsForm1GuideOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomFormTemplate[]>([]);
  const [deletingTemplate, setDeletingTemplate] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [fillModalState, setFillModalState] = useState<{
    isOpen: boolean;
    templateId: 'salary-slip-template' | 'clearance-form' | 'resignation-form';
    titleAr: string;
  } | null>(null);

  const { data: employeesResponse } = useEmployees({ pageSize: 500 });
  const employeesList = employeesResponse?.data || [];

  // Load custom-uploaded templates from IndexedDB
  useEffect(() => {
    customTemplatesStorage.getAll().then(setCustomTemplates).catch(console.error);
  }, []);

  const baseTemplates: FormTemplate[] = [
    {
      id: 'resignation-form',
      titleAr: 'نموذج استقالة وإجراءات إنهاء الخدمة',
      titleSecondary: '新希望埃及水产科技有限公司本地员工离职手续',
      description:
        'النموذج الرسمي المعتمد لتقديم طلب الاستقالة، حصر أسباب ترك العمل، جدول تسليم المهام والعهد، وموافقات الإدارات المعنية والمدير العام.',
      originalFileName: 'Resignation form新希望埃及水产科技有限公司本地员工离职手续.docx',
      downloadUrl: '/templates/resignation_form.docx',
      format: 'docx',
      fileSize: '53.7 KB',
      category: 'resignation',
      categoryLabelAr: 'إنهاء الخدمة والاستقالات',
      tags: ['استقالة', 'إنهاء خدمة', 'تسليم مهام', 'موافقة الإدارة', 'شؤون العاملين'],
      lastUpdated: '2026-10-22',
      colorScheme: {
        bg: 'from-amber-500/10 via-amber-500/5 to-transparent',
        border: 'hover:border-amber-300',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        badgeText: 'text-amber-700',
        iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
      },
    },
    {
      id: 'clearance-form',
      titleAr: 'نموذج إخلاء طرف موظف وتسليم العهد',
      titleSecondary: 'Employee Clearance & Asset Handover Form',
      description:
        'نموذج براءة الذمة الشامل المعتمد للموظف المنتهي خدمته؛ يشمل توقيعات إخلاء الطرف من المخازن، تكنولوجيا المعلومات، الحسابات، والموارد البشرية.',
      originalFileName: 'اخلاء طرف.docx',
      downloadUrl: '/templates/clearance_form.docx',
      format: 'docx',
      fileSize: '12.9 KB',
      category: 'resignation',
      categoryLabelAr: 'إنهاء الخدمة والاستقالات',
      tags: ['إخلاء طرف', 'تسليم عهد', 'براءة ذمة', 'مخازن', 'حسابات'],
      lastUpdated: '2026-10-22',
      colorScheme: {
        bg: 'from-rose-500/10 via-rose-500/5 to-transparent',
        border: 'hover:border-rose-300',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        badgeText: 'text-rose-700',
        iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
      },
    },
    {
      id: 'salary-slip-template',
      titleAr: 'نموذج شهادة مفردات مرتب معتمدة',
      titleSecondary: 'Salary Certificate & Pay Slip Official Template',
      description:
        'بيان رسمي ومعتمد بمفردات أجر الموظف (الأساسي، البدلات، الحوافز، والاستقطاعات وصافي الراتب) موجه للجهات الحكومية والبنوك والسفارات.',
      originalFileName: 'templete-مفردات المرتب.docx',
      downloadUrl: '/templates/salary_slip_template.docx',
      format: 'docx',
      fileSize: '60.6 KB',
      category: 'payroll',
      categoryLabelAr: 'الرواتب والشهادات المالية',
      tags: ['مفردات مرتب', 'شهادة دخل', 'بيان راتب', 'بنوك', 'جهات رسمية'],
      lastUpdated: '2026-10-22',
      colorScheme: {
        bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
        border: 'hover:border-emerald-300',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        badgeText: 'text-emerald-700',
        iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
      },
    },
    {
      id: 'insurance-form-1',
      titleAr: 'نموذج رقم (1) تأمينات اجتماعية (س1)',
      titleSecondary: 'Social Insurance Form 1 - Official Government Template',
      description:
        'النموذج الحكومي الأصلي المعتمد الصادر من الهيئة القومية للتأمين الاجتماعي (مكتب بلقاس - منشأة 2970938) لطلب اشتراك وتأمين موظف جديد.',
      originalFileName: 'نموذج رقم 1 طلب اشتراك مؤمن عليه.pdf',
      downloadUrl: '/templates/form1_insurance.pdf',
      format: 'pdf',
      fileSize: '738 KB',
      category: 'insurance',
      categoryLabelAr: 'التأمينات الاجتماعية والحكومية',
      tags: ['س1', 'طلب اشتراك', 'تأمينات بلقاس', '2970938', 'حكومي معتمد'],
      lastUpdated: '2026-10-22',
      hasGuideModal: true,
      colorScheme: {
        bg: 'from-blue-500/10 via-blue-500/5 to-transparent',
        border: 'hover:border-blue-300',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
        badgeText: 'text-blue-700',
        iconColor: 'text-red-600 bg-red-50 border-red-200',
      },
    },
    {
      id: 'id-badge-card',
      titleAr: 'بطاقة هوية وكارنيه العمل الرسمي (ID Badge)',
      titleSecondary: 'Official Employee Workforce ID Badge CR-80 Standard',
      description:
        'نظام تصميم وطباعة بطاقات الهوية الرسمية للعاملين بشركة نيوهوب؛ يشمل شعار الشركة، الصورة، الكود الوظيفي، فصيلة الدم، ورمز الاستجابة السريع QR للتحقق ببوابات الدخول.',
      originalFileName: 'Employee_ID_Badge_CR80.pdf',
      downloadUrl: '#',
      format: 'pdf',
      fileSize: '54x85.6 mm',
      category: 'administrative',
      categoryLabelAr: 'شؤون إدارية وعامة',
      tags: ['كارنيه', 'بطاقة هوية', 'بوابات', 'QR كود', 'فصيلة دم', 'PVC'],
      lastUpdated: '2026-10-22',
      colorScheme: {
        bg: 'from-purple-500/10 via-purple-500/5 to-transparent',
        border: 'hover:border-purple-300',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        badgeText: 'text-purple-700',
        iconColor: 'text-purple-600 bg-purple-50 border-purple-200',
      },
    },
  ];

  // Merge built-in official templates with custom-uploaded templates
  const allTemplates: FormTemplate[] = [...baseTemplates, ...customTemplates];

  const handleDownload = (tpl: FormTemplate) => {
    const a = document.createElement('a');
    a.href = tpl.fileData || tpl.downloadUrl;
    a.download = tpl.originalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = (tpl: FormTemplate) => {
    if (tpl.format === 'pdf') {
      window.open(tpl.fileData || tpl.downloadUrl, '_blank');
    } else {
      handleDownload(tpl);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    try {
      setIsDeleting(true);
      await customTemplatesStorage.delete(deletingTemplate.id);
      setCustomTemplates(prev => prev.filter(t => t.id !== deletingTemplate.id));
      setDeletingTemplate(null);
    } catch (err) {
      console.error('Failed to delete custom template:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Templates
  const filteredTemplates = allTemplates.filter(tpl => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tpl.titleAr.toLowerCase().includes(q) ||
      (tpl.titleSecondary && tpl.titleSecondary.toLowerCase().includes(q)) ||
      tpl.description.toLowerCase().includes(q) ||
      tpl.tags.some(tag => tag.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'custom' ? tpl.isCustom : tpl.category === selectedCategory);

    const matchesFormat = selectedFormat === 'all' || tpl.format === selectedFormat;

    return matchesSearch && matchesCategory && matchesFormat;
  });

  // Table Columns Definition
  const tableColumns: Column<FormTemplate>[] = useMemo(
    () => [
      {
        key: 'titleAr',
        header: 'اسم النموذج والمستند',
        sortable: true,
        render: row => (
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                row.format === 'pdf'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : row.format === 'xlsx'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
              }`}
            >
              {row.format === 'pdf' ? (
                <FileText className="w-5 h-5" />
              ) : row.format === 'xlsx' ? (
                <FileSpreadsheet className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <span>{row.titleAr}</span>
                {row.isCustom && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    مخصص
                  </span>
                )}
              </div>
              {row.titleSecondary && (
                <span className="text-[11px] text-slate-400 font-sans block truncate max-w-xs" dir="ltr">
                  {row.titleSecondary}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'التصنيف',
        sortable: true,
        render: row => (
          <Badge variant="neutral" className="text-[11px] font-medium">
            {row.categoryLabelAr}
          </Badge>
        ),
      },
      {
        key: 'format',
        header: 'النوع والحجم',
        render: row => (
          <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold">
            {row.format.toUpperCase()} • {row.fileSize}
          </span>
        ),
      },
      {
        key: 'lastUpdated',
        header: 'تاريخ التحديث',
        sortable: true,
        render: row => <span className="text-xs text-slate-500 font-mono">{row.lastUpdated}</span>,
      },
      {
        key: 'actions',
        header: 'الإجراءات المتاحة',
        align: 'left',
        render: row => (
          <div className="flex items-center gap-1.5 justify-end">
            {row.id === 'id-badge-card' ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CreditCard className="w-3 h-3" />}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBadgeModalOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold py-1 h-7"
              >
                🪪 صانع الكارنيهات
              </Button>
            ) : (
              <>
                {(row.id === 'salary-slip-template' ||
                  row.id === 'clearance-form' ||
                  row.id === 'resignation-form') && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Sparkles className="w-3 h-3 text-emerald-600" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFillModalState({
                        isOpen: true,
                        templateId: row.id as any,
                        titleAr: row.titleAr,
                      });
                    }}
                    className="border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[11px] font-bold py-1 h-7"
                  >
                    تعبئة
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer className="w-3 h-3 text-slate-600" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint(row);
                  }}
                  className="text-[11px] font-bold py-1 h-7"
                >
                  طباعة
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Download className="w-3 h-3" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(row);
                  }}
                  className="text-[11px] font-bold py-1 h-7 bg-slate-900 hover:bg-slate-800"
                >
                  تحميل
                </Button>
              </>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTemplateForDetails(row);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="معلومات وتفاصيل النموذج"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {row.isCustom && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingTemplate({ id: row.id, title: row.titleAr });
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="حذف هذا النموذج المخصص"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Matching Dashboard & Insurance Pages */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              نماذج ومستندات العمل الرسمية
            </h1>
            <Badge variant="default" className="text-xs font-bold">
              المكتبة الإدارية المعتمدة
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            مركز النماذج الحكومية، نماذج شؤون العاملين المعتمدة، شهادات مفردات الرواتب، واستمارات التأمينات الاجتماعية مع إمكانية التعبئة والطباعة الفورية.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
            onClick={() => setIsUploadModalOpen(true)}
            className="font-bold shadow-sm"
          >
            + رفع نموذج جديد
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<CreditCard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
            onClick={() => setIsBadgeModalOpen(true)}
            className="border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 font-bold"
          >
            🪪 طباعة الكارنيهات
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            onClick={() =>
              setFillModalState({
                isOpen: true,
                templateId: 'salary-slip-template',
                titleAr: 'نموذج شهادة مفردات مرتب معتمدة',
              })
            }
            className="border-emerald-300 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-bold"
          >
            ⚡ تعبئة لموظف
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
            onClick={() => window.open('/templates/form1_insurance.pdf', '_blank')}
            className="font-bold"
          >
            طباعة س1 تأمينات
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />}
            onClick={() => setIsForm1GuideOpen(true)}
            className="border-blue-200 dark:border-sky-900/40 text-blue-700 dark:text-sky-300 hover:bg-blue-50 dark:hover:bg-sky-950/30 font-bold"
          >
            دليل س1
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards - Standard Platform Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Templates */}
        <Card className="border-l-4 border-l-brand-500 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-brand-700 dark:text-[#38BDF8] uppercase tracking-wider block">
                إجمالي النماذج بالمكتبة
              </span>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-1 block">
                {allTemplates.length}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                مستندات Word وPDF وإكسل
              </span>
            </div>
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-[#38BDF8]">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Auto-Fill Ready */}
        <Card className="border-l-4 border-l-emerald-500 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                نماذج التعبئة الذكية بضغطة زر
              </span>
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                3
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                مفردات مرتب، إخلاء طرف، استقالة
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Government & Social Insurance */}
        <Card className="border-l-4 border-l-blue-500 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 dark:text-sky-400 uppercase tracking-wider block">
                النماذج الحكومية والتأمينية
              </span>
              <span className="text-3xl font-extrabold text-blue-600 dark:text-sky-400 mt-1 block">
                1
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                تأمينات بلقاس - منشأة 2970938
              </span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-sky-950/50 text-blue-600 dark:text-sky-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Custom Uploaded Templates */}
        <Card className="border-l-4 border-l-purple-500 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                نماذج مخصصة مرفوعة
              </span>
              <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-300 mt-1 block">
                {customTemplates.length}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                محفوظة بقاعدة بيانات النظام
              </span>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300">
              <UploadCloud className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filter Toolbar & View Toggle */}
      <div className="bg-white dark:bg-[#151D2E] rounded-2xl border border-slate-200/90 dark:border-[#1E293B] p-4 shadow-xs space-y-3.5">
        {/* Row 1: Search Input, Format Selector & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="ابحث بالاسم، الكود، الوصف، أو الكلمات الدلالية..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-[#0B0F19] focus:border-brand-500 dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-brand-500/20 transition-all text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end w-full sm:w-auto">
            {/* Format Filter Dropdown */}
            <select
              value={selectedFormat}
              onChange={e => setSelectedFormat(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="all">جميع الصيغ (Word / PDF / Excel)</option>
              <option value="docx">مستندات Word (.docx)</option>
              <option value="pdf">ملفات PDF (.pdf)</option>
              <option value="xlsx">جداول Excel (.xlsx)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-[#0B0F19] p-1 rounded-xl border border-slate-200 dark:border-[#1E293B] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#151D2E] text-slate-900 dark:text-[#F8FAFC] shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="عرض البطاقات"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#151D2E] text-slate-900 dark:text-[#F8FAFC] shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="عرض الجدول"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-[#1E293B] pt-3 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl transition-all font-semibold shrink-0 text-xs cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]'
              }`}
            >
              الكل ({allTemplates.length})
            </button>
            <button
              onClick={() => setSelectedCategory('resignation')}
              className={`px-3 py-1.5 rounded-xl transition-all font-semibold shrink-0 text-xs cursor-pointer ${
                selectedCategory === 'resignation'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]'
              }`}
            >
              إنهاء الخدمة والاستقالات
            </button>
            <button
              onClick={() => setSelectedCategory('payroll')}
              className={`px-3 py-1.5 rounded-xl transition-all font-semibold shrink-0 text-xs cursor-pointer ${
                selectedCategory === 'payroll'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]'
              }`}
            >
              مفردات المرتب
            </button>
            <button
              onClick={() => setSelectedCategory('insurance')}
              className={`px-3 py-1.5 rounded-xl transition-all font-semibold shrink-0 text-xs cursor-pointer ${
                selectedCategory === 'insurance'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]'
              }`}
            >
              التأمينات (س1)
            </button>
            {customTemplates.length > 0 && (
              <button
                onClick={() => setSelectedCategory('custom')}
                className={`px-3 py-1.5 rounded-xl transition-all font-semibold shrink-0 text-xs cursor-pointer ${
                  selectedCategory === 'custom'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/40'
                }`}
              >
                النماذج المخصصة ({customTemplates.length})
              </button>
            )}
          </div>

          {(searchQuery || selectedCategory !== 'all' || selectedFormat !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedFormat('all');
              }}
              className="text-xs text-brand-600 dark:text-[#38BDF8] hover:text-brand-800 dark:hover:text-brand-300 font-semibold shrink-0 cursor-pointer"
            >
              إلغاء الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Grid View or Table View */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white dark:bg-[#151D2E] rounded-2xl border border-slate-200 dark:border-[#1E293B] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#0B0F19] flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-[#F8FAFC]">لا توجد نماذج مطابقة للبحث</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            جرّب تغيير كلمات البحث أو إعادة ضبط خيارات التصفية لعرض جميع النماذج المتاحة.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedFormat('all');
            }}
          >
            إعادة ضبط الفلاتر
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card className="overflow-hidden">
          <DataTable
            columns={tableColumns}
            data={filteredTemplates}
            keyExtractor={row => row.id}
            searchable={false}
          />
        </Card>
      ) : (
        /* GRID VIEW (Modern Polish) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTemplates.map(tpl => (
            <div
              key={tpl.id}
              className="bg-white dark:bg-[#151D2E] rounded-2xl border border-slate-200/90 dark:border-[#1E293B] shadow-xs hover:shadow-md hover:border-brand-300 dark:hover:border-[#38BDF8]/50 transition-all duration-200 flex flex-col justify-between overflow-hidden relative group"
            >
              {/* Card Header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Document Format Icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                        tpl.format === 'pdf'
                          ? 'bg-red-50 dark:bg-rose-950/40 text-red-600 dark:text-rose-400 border-red-200 dark:border-rose-900/40'
                          : tpl.format === 'xlsx'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-blue-50 dark:bg-sky-950/40 text-blue-600 dark:text-sky-400 border-blue-200 dark:border-sky-900/40'
                      }`}
                    >
                      {tpl.format === 'pdf' ? (
                        <FileText className="w-6 h-6" />
                      ) : tpl.format === 'xlsx' ? (
                        <FileSpreadsheet className="w-6 h-6" />
                      ) : (
                        <FileText className="w-6 h-6" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tpl.colorScheme.badgeBg}`}
                        >
                          {tpl.categoryLabelAr}
                        </span>

                        {tpl.isCustom ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                            مخصص
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                            معتمد للشركة
                          </span>
                        )}

                        <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0B0F19] px-2 py-0.5 rounded">
                          {tpl.format.toUpperCase()} • {tpl.fileSize}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-brand-600 dark:group-hover:text-[#38BDF8] transition-colors mt-0.5">
                        {tpl.titleAr}
                      </h3>

                      {tpl.titleSecondary && (
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 font-sans truncate max-w-sm" dir="ltr">
                          {tpl.titleSecondary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed line-clamp-2">
                  {tpl.description}
                </p>
              </div>

              {/* Tags Bar */}
              <div className="px-5 py-2.5 bg-slate-50/60 dark:bg-[#0B0F19]/50 border-t border-slate-100 dark:border-[#1E293B] flex flex-wrap items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                {tpl.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#151D2E] border border-slate-200/80 dark:border-[#1E293B] px-2 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3.5 px-5 bg-white dark:bg-[#151D2E] border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedTemplateForDetails(tpl)}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-[#F8FAFC] flex items-center gap-1 transition-colors px-1.5 py-1 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>تفاصيل</span>
                  </button>

                  {/* Delete button for custom-uploaded templates */}
                  {tpl.isCustom && (
                    <button
                      type="button"
                      onClick={() => setDeletingTemplate({ id: tpl.id, title: tpl.titleAr })}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title="حذف هذا النموذج المخصص"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {tpl.id === 'id-badge-card' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                      onClick={() => setIsBadgeModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-1.5 px-4 shadow-sm"
                      title="فتح مصمم وطابعة كارنيهات الموظفين"
                    >
                      🪪 فتح صانع الكارنيهات
                    </Button>
                  ) : (
                    <>
                      {/* Auto-Fill Button for Standard Docx Templates */}
                      {(tpl.id === 'salary-slip-template' ||
                        tpl.id === 'clearance-form' ||
                        tpl.id === 'resignation-form') && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                          onClick={() =>
                            setFillModalState({
                              isOpen: true,
                              templateId: tpl.id as any,
                              titleAr: tpl.titleAr,
                            })
                          }
                          className="border-emerald-300 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold shadow-xs py-1.5"
                          title="تعبئة بيانات موظف وتوليد ملف Word جاهز"
                        >
                          ⚡ تعبئة لموظف
                        </Button>
                      )}

                      {/* Print Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
                        onClick={() => handlePrint(tpl)}
                        className="text-xs font-bold py-1.5"
                        title={tpl.format === 'pdf' ? 'فتح وطباعة A4 مباشرة' : 'تحميل للطباعة في Word'}
                      >
                        طباعة
                      </Button>

                      {/* Main Download Button */}
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        onClick={() => handleDownload(tpl)}
                        className="font-bold text-xs py-1.5 px-3.5"
                      >
                        تحميل
                      </Button>

                      {/* Optional Guide Modal for Insurance Form 1 */}
                      {tpl.hasGuideModal && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />}
                          onClick={() => setIsForm1GuideOpen(true)}
                          className="border-blue-200 dark:border-sky-900/40 text-blue-700 dark:text-sky-300 hover:bg-blue-50 dark:hover:bg-sky-950/30 text-xs font-bold py-1.5"
                          title="فتح دليل تعبئة الاستمارة بالبيانات المجهزة"
                        >
                          دليل س1
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details & Instructions Modal */}
      {selectedTemplateForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#151D2E] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-[#1E293B] space-y-5 text-right" dir="rtl">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#1E293B] pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedTemplateForDetails.format === 'pdf'
                      ? 'bg-red-50 dark:bg-rose-950/40 text-red-600 dark:text-rose-400'
                      : 'bg-blue-50 dark:bg-sky-950/40 text-blue-600 dark:text-sky-400'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-base">
                    {selectedTemplateForDetails.titleAr}
                  </h3>
                  {selectedTemplateForDetails.titleSecondary && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-sans block truncate max-w-xs" dir="ltr">
                      {selectedTemplateForDetails.titleSecondary}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplateForDetails(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E293B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#0B0F19] p-3.5 rounded-xl border border-slate-100 dark:border-[#1E293B]">
                {selectedTemplateForDetails.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 dark:bg-[#0B0F19] p-2.5 rounded-lg border border-slate-100 dark:border-[#1E293B]">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10.5px]">اسم الملف:</span>
                  <span className="font-semibold text-slate-800 dark:text-[#F8FAFC] truncate block">
                    {selectedTemplateForDetails.originalFileName}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#0B0F19] p-2.5 rounded-lg border border-slate-100 dark:border-[#1E293B]">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10.5px]">الصيغة والحجم:</span>
                  <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                    {selectedTemplateForDetails.format.toUpperCase()} ({selectedTemplateForDetails.fileSize})
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">الكلمات المفتاحية والتصنيف:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplateForDetails.tags.map((t, idx) => (
                    <span key={idx} className="bg-slate-100 dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10.5px] border border-slate-200/50 dark:border-[#1E293B]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTemplateForDetails(null)}
              >
                إغلاق
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => {
                  handleDownload(selectedTemplateForDetails);
                  setSelectedTemplateForDetails(null);
                }}
                className="font-bold"
              >
                تحميل الملف الآن
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Form 1 Guide Modal */}
      <InsuranceForm1GuideModal
        isOpen={isForm1GuideOpen}
        onClose={() => setIsForm1GuideOpen(false)}
      />

      {/* Employee Docx Auto-Fill Modal */}
      {fillModalState && (
        <EmployeeTemplateFillModal
          isOpen={fillModalState.isOpen}
          onClose={() => setFillModalState(null)}
          templateId={fillModalState.templateId}
          templateTitleAr={fillModalState.titleAr}
        />
      )}

      {/* Upload Custom Template Modal */}
      <UploadCustomTemplateModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onTemplateAdded={(newTpl) => {
          setCustomTemplates(prev => [newTpl, ...prev]);
        }}
      />

      {/* Confirm Delete Custom Template */}
      <ConfirmDialog
        isOpen={!!deletingTemplate}
        onClose={() => setDeletingTemplate(null)}
        onConfirm={handleConfirmDelete}
        title="حذف النموذج المخصص"
        message={`هل أنت متأكد من رغبتك في حذف نموذج "${deletingTemplate?.title}" نهائياً من المكتبة؟`}
        confirmLabel="نعم، حذف النموذج"
        cancelLabel="إلغاء"
        isDestructive
        isLoading={isDeleting}
      />

      {/* Employee ID Badge Modal */}
      {isBadgeModalOpen && employeesList.length > 0 && (
        <EmployeeBadgeModal
          isOpen={isBadgeModalOpen}
          onClose={() => setIsBadgeModalOpen(false)}
          employees={employeesList}
        />
      )}

    </div>
  );
};
