import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  Eye,
  Edit,
  FileText,
  FileCheck,
  Clock,
  CalendarDays,
  CreditCard,
  UserX,
  MoreVertical,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Trash2,
} from 'lucide-react';
import { cn, downloadCSV } from '../../lib/utils';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmployeeFormModal } from './EmployeeFormModal';
import { useQueryClient } from '@tanstack/react-query';
import { useEmployees, useDepartments, employeeKeys } from '../../hooks/queries';
import { Employee } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { ExcelImportModal } from '../../components/ui/ExcelImportModal';
import { employeeService } from '../../services/employeeService';

export const EmployeesListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const { data: departments = [] } = useDepartments();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDocStatus, setSelectedDocStatus] = useState<string>('all');
  const [selectedContractStatus, setSelectedContractStatus] = useState<string>('all');
  const [selectedInsuranceStatus, setSelectedInsuranceStatus] = useState<string>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deactivatingEmployee, setDeactivatingEmployee] = useState<Employee | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active action menu row id
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Memoized filter params for optimal React Query cache deduplication
  const filterParams = useMemo(
    () => ({
      pageSize: 400, // get workforce for client table
      departmentId: selectedDept !== 'all' ? selectedDept : undefined,
      employmentStatus: selectedStatus !== 'all' ? selectedStatus : undefined,
      contractStatus: selectedContractStatus !== 'all' ? selectedContractStatus : undefined,
      documentStatus: selectedDocStatus !== 'all' ? selectedDocStatus : undefined,
      insuranceStatus: selectedInsuranceStatus !== 'all' ? (selectedInsuranceStatus as any) : undefined,
    }),
    [selectedDept, selectedStatus, selectedContractStatus, selectedDocStatus, selectedInsuranceStatus]
  );

  // React Query cached employee fetch
  const {
    data: employeesResponse,
    isLoading,
    refetch,
  } = useEmployees(filterParams);

  const employees = employeesResponse?.data || [];

  const handleCreateOrUpdate = async (data: Partial<Employee>) => {
    if (editingEmployee) {
      await employeeService.updateEmployee(editingEmployee.id, data);
    } else {
      await employeeService.createEmployee(data);
    }
    await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    refetch();
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingEmployee) return;
    await employeeService.deactivateEmployee(deactivatingEmployee.id);
    success(`Employee ${deactivatingEmployee.firstName} ${deactivatingEmployee.lastName} has been marked as terminated.`);
    setDeactivatingEmployee(null);
    await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    refetch();
  };

  const handleBulkDeactivate = () => {
    success(`Bulk operation initiated for ${selectedIds.length} employees.`);
    setSelectedIds([]);
  };

  const isAllSelected = employees.length > 0 && employees.every(e => selectedIds.includes(e.id));
  const isSomeSelected = employees.some(e => selectedIds.includes(e.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map(e => e.id));
    }
  };

  const handleExportSelected = () => {
    const selectedRows = employees.filter(e => selectedIds.includes(e.id));
    if (selectedRows.length > 0) {
      downloadCSV('Selected_Employees_List', selectedRows);
      success(`تم تصدير ${selectedRows.length} موظف بنجاح.`);
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const count = await employeeService.deleteAllEmployees();
      success(t('employees.deleteAllSuccess', { count }) || `تم حذف جميع الموظفين (${count} موظف) بنجاح.`);
      setSelectedIds([]);
      setIsDeleteAllModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      refetch();
    } catch (err: any) {
      console.error('Failed to delete all employees', err);
      toastError(err?.message || 'فشل في حذف جميع الموظفين');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!selectedIds.length) return;
    setIsDeleting(true);
    try {
      const count = await employeeService.bulkDeleteEmployees(selectedIds);
      success(t('employees.bulkDeleteSuccess', { count }) || `تم حذف ${count} موظف بنجاح.`);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      refetch();
    } catch (err: any) {
      console.error('Failed to bulk delete employees', err);
      toastError(err?.message || 'فشل في حذف الموظفين المحددين');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deletingEmployee) return;
    setIsDeleting(true);
    try {
      await employeeService.deleteEmployee(deletingEmployee.id);
      success(t('employees.singleDeleteSuccess', { name: `${deletingEmployee.firstName} ${deletingEmployee.lastName}` }) || `تم حذف الموظف بنجاح.`);
      setSelectedIds(prev => prev.filter(id => id !== deletingEmployee.id));
      setDeletingEmployee(null);
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      refetch();
    } catch (err: any) {
      console.error('Failed to delete employee', err);
      toastError(err?.message || 'فشل في حذف الموظف');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: BadgeVariant }> = {
      active: { label: t('common.active'), variant: 'success' },
      probation: { label: t('common.probation'), variant: 'warning' },
      on_leave: { label: t('common.onLeave'), variant: 'info' },
      suspended: { label: t('common.suspended'), variant: 'danger' },
      terminated: { label: t('common.terminated'), variant: 'secondary' },
    };
    const s = map[status] || { label: status, variant: 'default' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const getContractBadge = (status: string) => {
    if (status === 'expiring_soon') return <Badge variant="warning">{t('common.expiringSoon')}</Badge>;
    if (status === 'expired') return <Badge variant="danger">{t('common.expired')}</Badge>;
    if (status === 'pending_renewal') return <Badge variant="info">Renewal Pending</Badge>;
    return <Badge variant="success">Active</Badge>;
  };

  const columns: Column<Employee>[] = useMemo(
    () => [
      {
        key: 'employeeId',
        header: t('employees.empId'),
        sortable: true,
        width: '110px',
        render: row => (
          <span className="font-mono font-semibold text-brand-700 bg-brand-50/70 px-2 py-0.5 rounded text-[11px]">
            {row.employeeId}
          </span>
        ),
      },
      {
        key: 'name',
        header: t('employees.name'),
        sortable: true,
        width: '280px',
        accessor: row => `${row.firstName} ${row.lastName}`,
        render: row => {
          const fullName = `${row.firstName} ${row.lastName}`.trim();
          const hasDifferentArabicName =
            row.arabicName && row.arabicName.trim().toLowerCase() !== fullName.toLowerCase();

          return (
            <div className="flex items-center gap-3 min-w-[250px]">
              <Avatar name={fullName} src={row.avatar} size="sm" />
              <div>
                <div className="font-semibold text-slate-900 hover:text-brand-600 transition-colors whitespace-nowrap">
                  {fullName}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap whitespace-nowrap">
                  {hasDifferentArabicName && (
                    <span className="text-slate-600 font-medium">{row.arabicName}</span>
                  )}
                  {row.nationalId && (
                    <span className="font-mono text-[10px] text-slate-400">ID: {row.nationalId}</span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'departmentName',
        header: t('common.department'),
        sortable: true,
        width: '150px',
        render: row => (
          <span className="text-slate-700 font-medium whitespace-nowrap">{row.departmentName}</span>
        ),
      },
      {
        key: 'positionTitle',
        header: t('common.position'),
        sortable: true,
        width: '220px',
        render: row => (
          <div className="min-w-[180px]">
            <span className="text-slate-800 font-medium block text-xs whitespace-nowrap">
              {row.chinesePosition || row.positionTitle}
            </span>
          </div>
        ),
      },
      {
        key: 'insuranceStatus',
        header: 'حالة التأمين (Insurance)',
        sortable: true,
        width: '160px',
        render: row => {
          if (row.insuranceStatus === 'insured') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Insured (مؤمن)
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Not Insured (غير مؤمن)
            </span>
          );
        },
      },
      {
        key: 'employmentStatus',
        header: t('common.status'),
        sortable: true,
        render: row => getStatusBadge(row.employmentStatus),
      },
      {
        key: 'contractStatus',
        header: t('employees.contract'),
        sortable: true,
        render: row => getContractBadge(row.contractStatus),
      },
      {
        key: 'documentCompletenessPercentage',
        header: t('employees.docStatus'),
        sortable: true,
        render: row => (
          <div className="flex items-center gap-2">
            <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  row.documentCompletenessPercentage === 100
                    ? 'bg-emerald-500'
                    : row.documentCompletenessPercentage >= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${row.documentCompletenessPercentage}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-600">
              {row.documentCompletenessPercentage}%
            </span>
          </div>
        ),
      },
      {
        key: 'hireDate',
        header: t('employees.hireDate'),
        sortable: true,
        hidden: true,
        render: row => <span className="text-slate-500 text-[11px]">{row.hireDate}</span>,
      },
      {
        key: 'actions',
        header: t('common.actions'),
        align: 'right',
        width: '80px',
        render: row => (
          <div className="relative">
            <button
              onClick={e => {
                e.stopPropagation();
                setActiveMenuId(activeMenuId === row.id ? null : row.id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {activeMenuId === row.id && (
              <div
                onClick={e => e.stopPropagation()}
                className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs text-left rtl:text-right"
              >
                <button
                  onClick={() => {
                    navigate(`/employees/${row.id}`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </button>
                <button
                  onClick={() => {
                    setEditingEmployee(row);
                    setIsFormOpen(true);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/documents?employee=${row.id}`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Documents</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/contracts`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Contract</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/attendance`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Attendance</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/leave`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Leave History</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/payroll`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Compensation</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    setDeactivatingEmployee(row);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-amber-50 flex items-center gap-2 text-amber-700"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>{t('employees.deactivateEmployee', 'Deactivate')}</span>
                </button>
                <button
                  onClick={() => {
                    setDeletingEmployee(row);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('employees.deleteSingle', 'Delete Permanently')}</span>
                </button>
              </div>
            )}
          </div>
        ),
      },
    ],
    [activeMenuId, navigate, t]
  );

  return (
    <div className="space-y-5" onClick={() => setActiveMenuId(null)}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('employees.directory')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('employees.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {employees.length > 0 && (
            <Button
              variant="outline"
              size="md"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
              leftIcon={<Trash2 className="w-4 h-4 text-rose-600" />}
              onClick={() => setIsDeleteAllModalOpen(true)}
            >
              {t('employees.deleteAll', 'حذف جميع الموظفين')}
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            leftIcon={<Upload className="w-4 h-4 text-brand-600" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            استيراد إكسيل / CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              setEditingEmployee(null);
              setIsFormOpen(true);
            }}
          >
            {t('employees.addEmployee')}
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={employees}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder={t('employees.searchPlaceholder', 'Search by name, ID, email, or Arabic name...')}
        exportFilename="Apex_Enterprise_Employees_Directory"
        selectable
        selectAllAcrossPages
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={row => navigate(`/employees/${row.id}`)}
        bulkActions={(ids, clear) => (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(employees.map(e => e.id))}
              disabled={ids.length === employees.length}
            >
              {t('employees.selectAll')} ({employees.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportSelected}
            >
              {t('employees.exportSelected')} ({ids.length})
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                if (ids.length === employees.length) {
                  setIsDeleteAllModalOpen(true);
                } else {
                  setIsBulkDeleteModalOpen(true);
                }
              }}
            >
              {ids.length === employees.length
                ? t('employees.deleteAll', 'حذف جميع الموظفين')
                : t('employees.deleteSelected', { count: ids.length })}
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkDeactivate}>
              {t('employees.deactivateSelected', { count: ids.length })}
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              {t('employees.clearSelection')}
            </Button>
          </div>
        )}
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2">
            {/* خانة تحديد كل الموظفين (Select All Employees Checkbox) */}
            <label
              title={isAllSelected ? t('employees.clearSelection') : t('employees.selectAll')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all shadow-sm select-none',
                isAllSelected
                  ? 'bg-brand-50 border-brand-400 text-brand-800 ring-1 ring-brand-300'
                  : isSomeSelected
                  ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              )}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={el => {
                  if (el) el.indeterminate = isSomeSelected && !isAllSelected;
                }}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer accent-brand-600"
              />
              <span className="whitespace-nowrap">
                {isAllSelected
                  ? t('employees.allSelectedCount', { count: employees.length })
                  : isSomeSelected
                  ? t('employees.selectedCountOf', { selected: selectedIds.length, total: employees.length })
                  : t('employees.selectAllCount', { count: employees.length })}
              </span>
            </label>
            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Employment Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>

            {/* Insurance Status Filter (Matches user's Excel) */}
            <select
              value={selectedInsuranceStatus}
              onChange={e => setSelectedInsuranceStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-semibold"
            >
              <option value="all">حالة التأمين: الكل</option>
              <option value="insured">مؤمن عليهم (Insured - 76)</option>
              <option value="not_insured">غير مؤمن عليهم (Not Insured - 199)</option>
            </select>

            {/* Document Completeness Filter */}
            <select
              value={selectedDocStatus}
              onChange={e => setSelectedDocStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">Document Completion</option>
              <option value="complete">100% Complete Files</option>
              <option value="incomplete">Missing Documents</option>
            </select>
          </div>
        }
      />

      {/* Excel / CSV Importer Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultTarget="employees"
        onImportComplete={refetch}
      />

      {/* Add / Edit Employee Wizard Modal */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingEmployee}
      />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deactivatingEmployee}
        onClose={() => setDeactivatingEmployee(null)}
        onConfirm={handleConfirmDeactivate}
        title="Confirm Termination / Deactivation"
        message={`Are you sure you want to deactivate ${deactivatingEmployee?.firstName} ${deactivatingEmployee?.lastName} (${deactivatingEmployee?.employeeId})? This will mark employment as terminated and expire all active contracts.`}
        confirmLabel="Deactivate Employee"
        isDestructive
      />

      {/* Delete All Employees Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title={t('employees.confirmDeleteAllTitle', 'تأكيد حذف جميع الموظفين')}
        message={t('employees.confirmDeleteAllMessage', { count: employees.length })}
        confirmLabel={t('employees.confirmDeleteAllButton', 'نعم، حذف جميع الموظفين نهائياً')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={t('employees.confirmBulkDeleteTitle', 'تأكيد حذف الموظفين المحددين')}
        message={t('employees.confirmBulkDeleteMessage', { count: selectedIds.length })}
        confirmLabel={t('employees.confirmBulkDeleteButton', 'حذف المحدد نهائياً')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Single Employee Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={handleConfirmSingleDelete}
        title={t('employees.confirmSingleDeleteTitle', 'تأكيد حذف الموظف')}
        message={t('employees.confirmSingleDeleteMessage', {
          name: `${deletingEmployee?.firstName} ${deletingEmployee?.lastName}`,
        })}
        confirmLabel={t('employees.confirmSingleDeleteButton', 'حذف نهائي')}
        cancelLabel={t('common.cancel', 'إلغاء')}
        isLoading={isDeleting}
        isDestructive
      />
    </div>
  );
};
