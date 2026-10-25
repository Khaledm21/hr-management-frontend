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
      toastError(t('positions.validationError'));
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
        success(t('positions.updateSuccess'));
      } else {
        await createMutation.mutateAsync(payload);
        success(t('positions.createSuccess'));
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toastError(err?.message || t('positions.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(t('positions.confirmDelete', { title }))) {
      try {
        await deleteMutation.mutateAsync(id);
        success(t('positions.deleteSuccess'));
      } catch {
        toastError(t('positions.deleteError'));
      }
    }
  };

  const getLevelLabel = (lvl: string) => {
    switch (lvl) {
      case 'Junior': return t('positions.levelJunior');
      case 'Mid': return t('positions.levelMid');
      case 'Senior': return t('positions.levelSenior');
      case 'Lead': return t('positions.levelLead');
      case 'Manager': return t('positions.levelManager');
      case 'Director': return t('positions.levelDirector');
      case 'Executive': return t('positions.levelExecutive');
      default: return lvl;
    }
  };

  const columns: Column<Position>[] = useMemo(
    () => [
      {
        key: 'code',
        header: t('positions.code'),
        sortable: true,
        width: '120px',
        render: row => (
          <span className="font-mono font-bold text-brand-700 dark:text-[#38BDF8] bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded text-xs">
            {row.code}
          </span>
        ),
      },
      {
        key: 'title',
        header: t('positions.jobTitle'),
        sortable: true,
        render: row => {
          const displayTitle = language === 'ar' ? (row.titleAr || row.title) : language === 'zh-CN' ? (row.titleZh || row.title) : row.title;
          return (
            <div>
              <div className="font-bold text-slate-900 dark:text-[#F8FAFC]">{displayTitle}</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">{row.title}</div>
            </div>
          );
        },
      },
      {
        key: 'departmentName',
        header: t('positions.department'),
        sortable: true,
        render: row => <span className="font-semibold text-slate-700 dark:text-slate-300">{row.departmentName}</span>,
      },
      {
        key: 'level',
        header: t('positions.level'),
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
            {getLevelLabel(row.level)}
          </Badge>
        ),
      },
      {
        key: 'salaryBand',
        header: t('positions.salaryBand'),
        sortable: true,
        accessor: row => row.minSalary,
        render: row => (
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {row.minSalary.toLocaleString()} - {row.maxSalary.toLocaleString()} {t('common.egp')}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        width: '100px',
        render: row => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-[#38BDF8] rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              title={t('common.edit')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(row.id, row.title)}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title={t('common.delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [language, t]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            {t('positions.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('positions.subtitle')}
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
            {t('common.refresh')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="text-xs font-bold shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {t('positions.addPosition')}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={positions}
        keyExtractor={row => row.id}
        searchable
        searchPlaceholder={t('positions.searchPlaceholder')}
        exportFilename="Company_Job_Positions_List"
        filtersSlot={
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-3 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-semibold"
          >
            <option value="all">{t('positions.allDepartments')}</option>
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
        title={editingPos ? t('positions.editModalTitle') : t('positions.addModalTitle')}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('positions.codeLabel')}</label>
              <Input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder={t('positions.codePlaceholder')}
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('positions.deptLabel')}</label>
              <select
                value={form.departmentId}
                onChange={e => setForm({ ...form, departmentId: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-3 py-2 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-medium"
                required
              >
                <option value="">{t('positions.selectDept')}</option>
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
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('positions.titleEn')}</label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder={t('positions.titleEnPlaceholder')}
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('positions.titleAr')}</label>
              <Input
                value={form.titleAr}
                onChange={e => setForm({ ...form, titleAr: e.target.value })}
                placeholder={t('positions.titleArPlaceholder')}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('positions.titleZh')}</label>
              <Input
                value={form.titleZh}
                onChange={e => setForm({ ...form, titleZh: e.target.value })}
                placeholder={t('positions.titleZhPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('positions.levelLabel')}</label>
              <select
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-3 py-2 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="Junior">{t('positions.levelJunior')}</option>
                <option value="Mid">{t('positions.levelMid')}</option>
                <option value="Senior">{t('positions.levelSenior')}</option>
                <option value="Lead">{t('positions.levelLead')}</option>
                <option value="Manager">{t('positions.levelManager')}</option>
                <option value="Director">{t('positions.levelDirector')}</option>
                <option value="Executive">{t('positions.levelExecutive')}</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('positions.minSalary')}</label>
              <Input
                type="number"
                value={form.minSalary}
                onChange={e => setForm({ ...form, minSalary: e.target.value })}
                placeholder="3500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('positions.maxSalary')}</label>
              <Input
                type="number"
                value={form.maxSalary}
                onChange={e => setForm({ ...form, maxSalary: e.target.value })}
                placeholder="7000"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : editingPos ? t('positions.updateBtn') : t('positions.createBtn')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
