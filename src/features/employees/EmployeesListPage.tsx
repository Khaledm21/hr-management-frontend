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
import { EmployeeBadgeModal } from './components/badge/EmployeeBadgeModal';
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
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [badgeModalEmployees, setBadgeModalEmployees] = useState<Employee[]>([]);

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
    success(t('employees.deactivateSuccess', { name: `${deactivatingEmployee.firstName} ${deactivatingEmployee.lastName}` }));
    setDeactivatingEmployee(null);
    await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    refetch();
  };

  const handleBulkDeactivate = () => {
    success(t('employees.bulkDeactivateSuccess', { count: selectedIds.length }));
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
      success(t('employees.exportSuccess', { count: selectedRows.length }));
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const count = await employeeService.deleteAllEmployees();
      success(t('employees.deleteAllSuccess', { count }));
      setSelectedIds([]);
      setIsDeleteAllModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      refetch();
    } catch (err: any) {
      console.error('Failed to delete all employees', err);
      toastError(err?.message || t('employees.deleteAllError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!selectedIds.length) return;
    setIsDeleting(true);
    try {
      const count = await employeeService.bulkDeleteEmployees(selectedIds);
      success(t('employees.bulkDeleteSuccess', { count }));
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      refetch();
    } catch (err: any) {
      console.error('Failed to bulk delete employees', err);
      toastError(err?.message || t('employees.bulkDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deletingEmployee) return;
    setIsDeleting(true);
    try {
      await employeeService.deleteEmployee(deletingEmployee.id);
      success(t('employees.singleDeleteSuccess', { name: `${deletingEmployee.firstName} ${deletingEmployee.lastName}` }));
      setSelectedIds(prev => prev.filter(id => id !== deletingEmployee.id));
      setDeletingEmployee(null);
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      refetch();
    } catch (err: any) {
      console.error('Failed to delete employee', err);
      toastError(err?.message || t('employees.singleDeleteError'));
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
    if (status === 'pending_renewal') return <Badge variant="info">{t('common.pendingRenewal')}</Badge>;
    return <Badge variant="success">{t('common.active')}</Badge>;
  };

  const columns: Column<Employee>[] = useMemo(
    () => [
      {
        key: 'employeeId',
        header: t('employees.empId'),
        sortable: true,
        width: '110px',
        render: row => (
          <span className="font-mono font-semibold text-brand-700 dark:text-[#38BDF8] bg-brand-50/70 dark:bg-[#38BDF8]/10 px-2 py-0.5 rounded text-[11px]">
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
                <div className="font-semibold text-slate-900 dark:text-[#F8FAFC] hover:text-brand-600 dark:hover:text-[#38BDF8] transition-colors whitespace-nowrap">
                  {fullName}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 flex-wrap whitespace-nowrap">
                  {hasDifferentArabicName && (
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{row.arabicName}</span>
                  )}
                  {row.nationalId && (
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-400">{t('employees.nationalIdShort')}: {row.nationalId}</span>
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
          <span className="text-slate-700 dark:text-[#CBD5E1] font-medium whitespace-nowrap">{row.departmentName}</span>
        ),
      },
      {
        key: 'positionTitle',
        header: t('common.position'),
        sortable: true,
        width: '220px',
        render: row => (
          <div className="min-w-[180px]">
            <span className="text-slate-800 dark:text-[#CBD5E1] font-medium block text-xs whitespace-nowrap">
              {row.chinesePosition || row.positionTitle}
            </span>
          </div>
        ),
      },
      {
        key: 'insuranceStatus',
        header: t('employees.insuranceStatus'),
        sortable: true,
        width: '160px',
        render: row => {
          if (row.insuranceStatus === 'insured') {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t('employees.insured')}
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/40 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {t('employees.notInsured')}
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {activeMenuId === row.id && (
              <div
                onClick={e => e.stopPropagation()}
                className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1 w-44 bg-white dark:bg-[#151D2E] rounded-xl shadow-xl border border-slate-200 dark:border-[#1E293B] py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs text-left rtl:text-right"
              >
                <button
                  onClick={() => {
                    navigate(`/employees/${row.id}`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1E293B] flex items-center gap-2 text-slate-700 dark:text-[#F8FAFC]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('employees.viewProfile')}</span>
                </button>
                <button
                  onClick={() => {
                    setBadgeModalEmployees([row]);
                    setIsBadgeModalOpen(true);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 text-slate-700 dark:text-emerald-300 font-semibold"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('employees.printBadge')}</span>
                </button>
                <button
                  onClick={() => {
                    setEditingEmployee(row);
                    setIsFormOpen(true);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1E293B] flex items-center gap-2 text-slate-700 dark:text-[#F8FAFC]"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{t('employees.editDetails')}</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/documents?employee=${row.id}`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1E293B] flex items-center gap-2 text-slate-700 dark:text-[#F8FAFC]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('employees.documentsTab')}</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/contracts`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1E293B] flex items-center gap-2 text-slate-700 dark:text-[#F8FAFC]"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>{t('employees.contractsTab')}</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/attendance`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1E293B] flex items-center gap-2 text-slate-700 dark:text-[#F8FAFC]"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('employees.attendanceTab')}</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/leave`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1E293B] flex items-center gap-2 text-slate-700 dark:text-[#F8FAFC]"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{t('employees.leaveTab')}</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/payroll`);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1E293B] flex items-center gap-2 text-slate-700 dark:text-[#F8FAFC]"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t('employees.payrollTab')}</span>
                </button>
                <div className="border-t border-slate-100 dark:border-[#1E293B] my-1" />
                <button
                  onClick={() => {
                    setDeactivatingEmployee(row);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 text-amber-700 dark:text-amber-400"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>{t('employees.deactivateEmployee', 'Deactivate')}</span>
                </button>
                <button
                  onClick={() => {
                    setDeletingEmployee(row);
                    setActiveMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium"
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            {t('employees.directory')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">{t('employees.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {employees.length > 0 && (
            <Button
              variant="outline"
              size="md"
              className="border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300"
              leftIcon={<Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={() => setIsDeleteAllModalOpen(true)}
            >
              {t('employees.deleteAll')}
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            leftIcon={<Upload className="w-4 h-4 text-brand-600 dark:text-[#38BDF8]" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            {t('employees.importExcel')}
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
              variant="outline"
              size="sm"
              className="border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 font-bold"
              leftIcon={<CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              onClick={() => {
                const selectedEmployees = employees.filter(e => ids.includes(e.id));
                setBadgeModalEmployees(selectedEmployees);
                setIsBadgeModalOpen(true);
              }}
            >
              {t('employees.printBadgesCount', { count: ids.length })}
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
                ? t('employees.deleteAll')
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
                  ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-400 dark:border-brand-500 text-brand-800 dark:text-[#38BDF8] ring-1 ring-brand-300'
                  : isSomeSelected
                  ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                  : 'bg-white dark:bg-[#151D2E] border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#1E293B]'
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
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('employees.allDepartments')}</option>
              {departments.map(d => (
                <option key={d.id} value={d.id} className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">
                  {d.name}
                </option>
              ))}
            </select>

            {/* Employment Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('employees.allStatuses')}</option>
              <option value="active" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('common.active')}</option>
              <option value="probation" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('common.probation')}</option>
              <option value="on_leave" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('common.onLeave')}</option>
              <option value="terminated" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('common.terminated')}</option>
            </select>

            {/* Insurance Status Filter (Matches user's Excel) */}
            <select
              value={selectedInsuranceStatus}
              onChange={e => setSelectedInsuranceStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer font-semibold"
            >
              <option value="all" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('employees.insuranceFilterAll')}</option>
              <option value="insured" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('employees.insuranceFilterInsured')}</option>
              <option value="not_insured" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('employees.insuranceFilterNotInsured')}</option>
            </select>

            {/* Document Completeness Filter */}
            <select
              value={selectedDocStatus}
              onChange={e => setSelectedDocStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('employees.docFilterAll')}</option>
              <option value="complete" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('employees.docFilterComplete')}</option>
              <option value="incomplete" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('employees.docFilterIncomplete')}</option>
            </select>

            {/* Bulk Badge Print Button */}
            {selectedIds.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                onClick={() => {
                  const selectedEmps = employees.filter(e => selectedIds.includes(e.id));
                  setBadgeModalEmployees(selectedEmps);
                  setIsBadgeModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold shadow-xs whitespace-nowrap"
              >
                {t('employees.printBadgesCount', { count: selectedIds.length })}
              </Button>
            )}
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
        title={t('employees.confirmDeactivateTitle')}
        message={t('employees.confirmDeactivateMessage', {
          name: `${deactivatingEmployee?.firstName} ${deactivatingEmployee?.lastName}`,
          id: deactivatingEmployee?.employeeId,
        })}
        confirmLabel={t('employees.confirmDeactivateButton')}
        cancelLabel={t('common.cancel')}
        isDestructive
      />

      {/* Delete All Employees Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title={t('employees.confirmDeleteAllTitle')}
        message={t('employees.confirmDeleteAllMessage', { count: employees.length })}
        confirmLabel={t('employees.confirmDeleteAllButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={t('employees.confirmBulkDeleteTitle')}
        message={t('employees.confirmBulkDeleteMessage', { count: selectedIds.length })}
        confirmLabel={t('employees.confirmBulkDeleteButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Single Employee Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={handleConfirmSingleDelete}
        title={t('employees.confirmSingleDeleteTitle')}
        message={t('employees.confirmSingleDeleteMessage', {
          name: `${deletingEmployee?.firstName} ${deletingEmployee?.lastName}`,
        })}
        confirmLabel={t('employees.confirmSingleDeleteButton')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        isDestructive
      />

      {/* Employee ID Badge Modal */}
      {isBadgeModalOpen && badgeModalEmployees.length > 0 && (
        <EmployeeBadgeModal
          isOpen={isBadgeModalOpen}
          onClose={() => {
            setIsBadgeModalOpen(false);
            setBadgeModalEmployees([]);
          }}
          employees={badgeModalEmployees}
        />
      )}
    </div>
  );
};
