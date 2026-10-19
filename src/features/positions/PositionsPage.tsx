import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Position } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { Briefcase, Plus, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { useDirection } from '../../context/DirectionContext';
import {
  usePositionsQuery,
  useDepartments,
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useDeletePositionMutation,
} from '../../hooks/queries';

export const PositionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useDirection();
  const { success, error: toastError } = useToast();

  const [selectedDept, setSelectedDept] = useState<string>('all');

  // React Query hooks
  const {
    data: positions = [],
    isLoading: isLoadingPositions,
    refetch,
  } = usePositionsQuery({ departmentId: selectedDept });

  const { data: departments = [] } = useDepartments();
  const createMutation = useCreatePositionMutation();
  const updateMutation = useUpdatePositionMutation();
  const deleteMutation = useDeletePositionMutation();

  const isLoading = isLoadingPositions;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    title: '',
    titleAr: '',
    titleZh: '',
    departmentId: '',
    minSalary: '',
    maxSalary: '',
    level: 'Mid',
  });

  const handleOpenAddModal = () => {
    setEditingPos(null);
    setForm({
      code: '',
      title: '',
      titleAr: '',
      titleZh: '',
      departmentId: departments[0]?.id || '',
      minSalary: '4000',
      maxSalary: '8000',
      level: 'Mid',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pos: Position) => {
    setEditingPos(pos);
    setForm({
      code: pos.code,
      title: pos.title,
      titleAr: pos.titleAr || '',
      titleZh: pos.titleZh || '',
      departmentId: pos.departmentId,
      minSalary: String(pos.minSalary),
      maxSalary: String(pos.maxSalary),
      level: pos.level,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.title.trim() || !form.departmentId) {
      toastError('يرجى إدخال الكود، المسمى، وتحديد القسم');
      return;
    }

    const selectedDepartment = departments.find(d => d.id === form.departmentId);

    setIsSubmitting(true);
    try {
      const payload: Partial<Position> = {
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        titleAr: form.titleAr.trim() || form.title.trim(),
        titleZh: form.titleZh.trim() || form.title.trim(),
        departmentId: form.departmentId,
        departmentName: selectedDepartment?.name || 'General',
        minSalary: Number(form.minSalary) || 3500,
        maxSalary: Number(form.maxSalary) || 7000,
        level: form.level,
      };

      if (editingPos) {
        await updateMutation.mutateAsync({ id: editingPos.id, data: payload });
        success('تم تحديث المسمى الوظيفي بنجاح');
      } else {
        await createMutation.mutateAsync(payload);
        success('تمت إضافة المسمى الوظيفي بنجاح');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toastError(err?.message || 'فشل حفظ المسمى الوظيفي');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المسمى الوظيفي "${title}"؟`)) {
      try {
        await deleteMutation.mutateAsync(id);
        success('تم حذف المسمى الوظيفي بنجاح');
      } catch {
        toastError('فشل حذف المسمى الوظيفي');
      }
    }
  };

  const columns: Column<Position>[] = useMemo(
    () => [
      {
        key: 'code',
        header: 'كود المسمى',
        sortable: true,
        width: '120px',
        render: row => (
          <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-xs">
            {row.code}
          </span>
        ),
      },
      {
        key: 'title',
        header: 'المسمى الوظيفي',
        sortable: true,
        render: row => {
          const displayTitle = language === 'ar' ? (row.titleAr || row.title) : language === 'zh-CN' ? (row.titleZh || row.title) : row.title;
          return (
            <div>
              <div className="font-bold text-slate-900">{displayTitle}</div>
              <div className="text-[11px] text-slate-400">{row.title}</div>
            </div>
          );
        },
      },
      {
        key: 'departmentName',
        header: 'القسم التابع له',
        sortable: true,
        render: row => <span className="font-semibold text-slate-700">{row.departmentName}</span>,
      },
      {
        key: 'level',
        header: 'المستوى الوظيفي',
        sortable: true,
        render: row => (
          <Badge
            variant={
              row.level === 'Executive'
                ? 'danger'
                : row.level === 'Director'
                ? 'warning'
                : row.level === 'Lead' || row.level === 'Senior'
                ? 'info'
                : 'default'
            }
          >
            {row.level}
          </Badge>
        ),
      },
      {
        key: 'salaryBand',
        header: 'نطاق الراتب (جنيه)',
        sortable: true,
        accessor: row => row.minSalary,
        render: row => (
          <span className="font-bold text-slate-800">
            {row.minSalary.toLocaleString()} - {row.maxSalary.toLocaleString()} جنيه
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'الإجراءات',
        width: '100px',
        render: row => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="تعديل"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(row.id, row.title)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="حذف"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [language]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('nav.positions', 'المسميات الوظيفية والدرجات')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            دليل التوصيف الوظيفي، الدرجات، ونطاقات الرواتب المعتمدة (مربوط بالباك إند مباشرة)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs font-semibold"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="text-xs font-bold shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            إضافة مسمى وظيفي
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={positions}
        keyExtractor={row => row.id}
        searchable
        searchPlaceholder="بحث في المسميات الوظيفية أو الكود..."
        exportFilename="Company_Job_Positions_List"
        filtersSlot={
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-semibold"
          >
            <option value="all">جميع الأقسام</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {language === 'ar' ? (d.nameAr || d.name) : d.name}
              </option>
            ))}
          </select>
        }
      />

      {/* Add / Edit Position Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPos ? 'تعديل مسمى وظيفي' : 'إضافة مسمى وظيفي جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">كود المسمى *</label>
              <Input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="مثال: POS-01, DEV-02"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">القسم التابع له *</label>
              <select
                value={form.departmentId}
                onChange={e => setForm({ ...form, departmentId: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-medium"
                required
              >
                <option value="">اختر القسم</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {language === 'ar' ? (d.nameAr || d.name) : d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">المسمى (بالإنجليزية) *</label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: Logistics Coordinator"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">المسمى (بالعربية)</label>
              <Input
                value={form.titleAr}
                onChange={e => setForm({ ...form, titleAr: e.target.value })}
                placeholder="مثال: منسق حركة ولوجستيات"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">المسمى (بالصينية)</label>
              <Input
                value={form.titleZh}
                onChange={e => setForm({ ...form, titleZh: e.target.value })}
                placeholder="مثال: 后勤协调员"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">المستوى الوظيفي</label>
              <select
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="Junior">Junior (مبتدئ)</option>
                <option value="Mid">Mid (متوسط)</option>
                <option value="Senior">Senior (أول)</option>
                <option value="Lead">Lead (رئيس فريق)</option>
                <option value="Manager">Manager (مدير)</option>
                <option value="Director">Director (مدير إدارة)</option>
                <option value="Executive">Executive (تنفيذي)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">الحد الأدنى للراتب (جنيه)</label>
              <Input
                type="number"
                value={form.minSalary}
                onChange={e => setForm({ ...form, minSalary: e.target.value })}
                placeholder="3500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">الحد الأقصى للراتب (جنيه)</label>
              <Input
                type="number"
                value={form.maxSalary}
                onChange={e => setForm({ ...form, maxSalary: e.target.value })}
                placeholder="7000"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : editingPos ? 'تحديث المسمى' : 'إضافة المسمى'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
