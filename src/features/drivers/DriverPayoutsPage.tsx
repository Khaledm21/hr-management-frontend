import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Truck,
  Plus,
  FileSpreadsheet,
  Printer,
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import {
  Driver,
  DriverPayoutTransaction,
  WeeklyPayoutSummary,
  DriverWeeklyColumn,
  DriverCategory,
} from '../../types/driverPayouts';
import { driverPayoutService, normalizeVehicleType } from '../../services/driverPayoutService';
import { cn } from '../../lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  driverKeys,
  useDriverMatrix,
  useDrivers,
  useWeeklySummaries,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useCreatePayoutMutation,
  useUpdatePayoutMutation,
  useDeletePayoutMutation,
  useCreateWeekMutation,
} from '../../hooks/queries';

// Subcomponents
import { DriverPayoutKPIs } from './components/DriverPayoutKPIs';
import { DriverDepartmentBreakdown } from './components/DriverDepartmentBreakdown';
import { DriverMatrixTable } from './components/DriverMatrixTable';
import { DriverTransactionsTable } from './components/DriverTransactionsTable';
import { DriverRosterGrid } from './components/DriverRosterGrid';
import { DriverAnalyticsCharts } from './components/DriverAnalyticsCharts';
import { PayoutFormModal } from './components/PayoutFormModal';
import { DriverFormModal } from './components/DriverFormModal';
import { NewWeekModal } from './components/NewWeekModal';
import { DriverExcelImportModal } from './components/DriverExcelImportModal';
import { DriverPrintReportModal } from './components/DriverPrintReportModal';

export const DriverPayoutsPage: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'matrix' | 'transactions' | 'drivers' | 'analytics'>('matrix');
  const [selectedWeek, setSelectedWeek] = useState<string>('2026-10-18');

  // React Query Cached Data
  const { data: weeklyData, isLoading: isMatrixLoading } = useDriverMatrix(selectedWeek);
  const { data: weeklySummaries = [] } = useWeeklySummaries();
  const { data: allDrivers = [] } = useDrivers();

  // React Query Mutations with automatic cache invalidation
  const createDriverMutation = useCreateDriverMutation();
  const updateDriverMutation = useUpdateDriverMutation();
  const createPayoutMutation = useCreatePayoutMutation();
  const updatePayoutMutation = useUpdatePayoutMutation();
  const deletePayoutMutation = useDeletePayoutMutation();
  const createWeekMutation = useCreateWeekMutation();

  const isLoading = isMatrixLoading;

  // Derived transactions for the current week directly from matrix columns (0 network overhead)
  const allTransactions = useMemo(() => {
    return weeklyData?.columns ? weeklyData.columns.flatMap(c => c.transactions || []) : [];
  }, [weeklyData]);

  // Filters for Transactions Log
  const [txSearch, setTxSearch] = useState<string>('');
  const [txDriverFilter, setTxDriverFilter] = useState<string>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');

  // Modals state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isNewWeekModalOpen, setIsNewWeekModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<DriverPayoutTransaction | null>(null);
  const [selectedDriverForEdit, setSelectedDriverForEdit] = useState<Driver | null>(null);
  const [txToDelete, setTxToDelete] = useState<DriverPayoutTransaction | null>(null);

  // Forms
  const [payoutForm, setPayoutForm] = useState({
    driverId: '',
    amount: '',
    category: 'production' as DriverCategory,
    date: '2026-10-18',
    description: '',
    vehiclePlate: '',
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'cheque',
    status: 'paid' as 'paid' | 'pending',
  });

  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    nationalId: '',
    vehicleNumber: '',
    vehicleType: 'ميكروباص',
    defaultCategory: 'production' as DriverCategory,
    notes: '',
  });

  const [newWeekDate, setNewWeekDate] = useState('2026-10-25');
  const [newWeekLabel, setNewWeekLabel] = useState('Sunday, October 25, 2026');

  // Payout Handlers
  const handleOpenNewPayoutModal = (presetDriverId?: string) => {
    setSelectedTxForEdit(null);
    const targetDriver = allDrivers.find(d => d.id === presetDriverId) || allDrivers[0];
    setPayoutForm({
      driverId: targetDriver?.id || '',
      amount: '',
      category: targetDriver?.defaultCategory || 'production',
      date: selectedWeek,
      description: '',
      vehiclePlate: targetDriver?.vehicleNumber || '',
      paymentMethod: 'cash',
      status: 'paid',
    });
    setIsPayoutModalOpen(true);
  };

  const handleOpenEditPayoutModal = (tx: DriverPayoutTransaction) => {
    setSelectedTxForEdit(tx);
    setPayoutForm({
      driverId: tx.driverId,
      amount: String(tx.amount),
      category: tx.category,
      date: tx.date,
      description: tx.description || '',
      vehiclePlate: tx.vehiclePlate || '',
      paymentMethod: tx.paymentMethod,
      status: tx.status as 'paid' | 'pending',
    });
    setIsPayoutModalOpen(true);
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.driverId || !payoutForm.amount) {
      toastError(t('driverPayouts.selectDriverPlaceholder', 'يرجى تحديد السائق والمبلغ'));
      return;
    }

    const driver = allDrivers.find(d => d.id === payoutForm.driverId);
    if (!driver) return;

    try {
      const numAmount = parseFloat(payoutForm.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        toastError(t('driverPayouts.amountEgpLabel', 'يرجى إدخال مبلغ صحيح'));
        return;
      }

      if (selectedTxForEdit) {
        await updatePayoutMutation.mutateAsync({
          id: selectedTxForEdit.id,
          data: {
            driverId: driver.id,
            driverName: driver.name,
            amount: numAmount,
            category: payoutForm.category,
            date: payoutForm.date,
            description: payoutForm.description,
            vehiclePlate: payoutForm.vehiclePlate,
            paymentMethod: payoutForm.paymentMethod,
            status: payoutForm.status,
          },
        });
        success(t('driverPayouts.toastPayoutSaved', 'تم تحديث دفعة القبض بنجاح'));
      } else {
        await createPayoutMutation.mutateAsync({
          driverId: driver.id,
          driverName: driver.name,
          weekPeriod: selectedWeek,
          date: payoutForm.date,
          amount: numAmount,
          category: payoutForm.category,
          description: payoutForm.description,
          vehiclePlate: payoutForm.vehiclePlate,
          paymentMethod: payoutForm.paymentMethod,
          status: payoutForm.status,
        });
        success(t('driverPayouts.toastPayoutSaved', `تم تسجيل دفعة القبض للسائق ${driver.name}`));
      }

      setIsPayoutModalOpen(false);
    } catch {
      toastError(t('driverPayouts.toastPayoutSaveFailed', 'فشل حفظ الدفعة'));
    }
  };

  const handleDeletePayoutConfirm = async () => {
    if (!txToDelete) return;
    try {
      await deletePayoutMutation.mutateAsync(txToDelete.id);
      success(t('driverPayouts.toastTxDeleted', 'تم حذف المعاملة بنجاح'));
      setTxToDelete(null);
    } catch {
      toastError(t('driverPayouts.toastTxDeleteFailed', 'فشل حذف المعاملة'));
    }
  };

  // Driver Handlers
  const handleOpenNewDriverModal = () => {
    setSelectedDriverForEdit(null);
    setDriverForm({
      name: '',
      phone: '',
      nationalId: '',
      vehicleNumber: '',
      vehicleType: 'ميكروباص',
      defaultCategory: 'production',
      notes: '',
    });
    setIsDriverModalOpen(true);
  };

  const handleOpenEditDriverModal = (driver: Driver) => {
    setSelectedDriverForEdit(driver);
    setDriverForm({
      name: driver.name,
      phone: driver.phone || '',
      nationalId: driver.nationalId || '',
      vehicleNumber: driver.vehicleNumber || '',
      vehicleType: driver.vehicleType || 'ميكروباص',
      defaultCategory: driver.defaultCategory || 'production',
      notes: driver.notes || '',
    });
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name.trim()) {
      toastError(t('driverPayouts.driverFullName', 'يرجى إدخال اسم السائق'));
      return;
    }

    try {
      if (selectedDriverForEdit) {
        await updateDriverMutation.mutateAsync({
          id: selectedDriverForEdit.id,
          data: {
            name: driverForm.name.trim(),
            phone: driverForm.phone,
            nationalId: driverForm.nationalId,
            vehicleNumber: driverForm.vehicleNumber,
            vehicleType: driverForm.vehicleType,
            defaultCategory: driverForm.defaultCategory,
            notes: driverForm.notes,
          },
        });
        success(t('driverPayouts.toastDriverUpdated', 'تم تحديث بيانات السائق بنجاح'));
      } else {
        await createDriverMutation.mutateAsync({
          name: driverForm.name.trim(),
          phone: driverForm.phone,
          nationalId: driverForm.nationalId,
          vehicleNumber: driverForm.vehicleNumber,
          vehicleType: driverForm.vehicleType,
          defaultCategory: driverForm.defaultCategory,
          status: 'active',
          notes: driverForm.notes,
        });
        success(t('driverPayouts.toastDriverSaved', `تمت إضافة السائق ${driverForm.name} بنجاح`));
      }

      setIsDriverModalOpen(false);
      setSelectedDriverForEdit(null);
      setDriverForm({
        name: '',
        phone: '',
        nationalId: '',
        vehicleNumber: '',
        vehicleType: 'ميكروباص',
        defaultCategory: 'production',
        notes: '',
      });
    } catch {
      toastError(t('driverPayouts.toastDriverSaveFailed', 'فشل حفظ بيانات السائق'));
    }
  };

  const handleCreateNewWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWeekMutation.mutateAsync({ date: newWeekDate, label: newWeekLabel });
      success(t('driverPayouts.toastWeekCreated', `تم إنشاء الأسبوع ${newWeekLabel} بنجاح`));
      setSelectedWeek(newWeekDate);
      setIsNewWeekModalOpen(false);
    } catch {
      toastError(t('driverPayouts.toastWeekCreateFailed', 'فشل إنشاء الأسبوع'));
    }
  };

  const handleExportExcel = async () => {
    try {
      await driverPayoutService.exportWeeklyMatrixToExcel(selectedWeek);
      success(t('driverPayouts.toastExcelExported', 'تم تصدير ملف الإكسيل بنجاح'));
    } catch {
      toastError(t('driverPayouts.toastExcelExportFailed', 'حدث خطأ أثناء تصدير ملف الإكسيل'));
    }
  };

  const handleResetZeroData = () => {
    if (window.confirm('هل تريد تصفير كافة البيانات المحلية تماماً لربط الباك إند النظيف؟')) {
      driverPayoutService.clearAllData();
      success('تم تصفير كافة البيانات بنجاح، النظام جاهز للباك إند');
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
    }
  };

  // Filtered transactions for Log view
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      if (txDriverFilter !== 'all' && tx.driverId !== txDriverFilter) return false;
      if (txCategoryFilter !== 'all' && tx.category !== txCategoryFilter) return false;
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase().trim();
        const matchName = tx.driverName.toLowerCase().includes(q);
        const matchDesc = tx.description?.toLowerCase().includes(q);
        const matchPlate = tx.vehiclePlate?.toLowerCase().includes(q);
        const matchReceipt = tx.receiptNumber?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchPlate && !matchReceipt) return false;
      }
      return true;
    });
  }, [allTransactions, txDriverFilter, txCategoryFilter, txSearch]);

  const summary = weeklyData?.summary;

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20 font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {t('driverPayouts.weeklySheetTitle', 'الملخص الأسبوعي - متابعة قبض السواقين')}
              </h1>
              <Badge variant="warning" className="text-xs font-semibold px-2.5 py-0.5">
                {t('driverPayouts.backendConnected', 'مربوط بالباك إند')}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('driverPayouts.subtitle', 'الملخص الأسبوعي ومصفوفة دفعات السائقين وتوزيعات الإدارة والإنتاج')}
            </p>
          </div>
        </div>

        {/* Action Controls & Week Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {weeklySummaries.length === 0 ? (
                <option value={selectedWeek}>{selectedWeek}</option>
              ) : (
                weeklySummaries.map(s => (
                  <option key={s.weekPeriod} value={s.weekPeriod}>
                    {s.weekLabel || s.weekPeriod}
                  </option>
                ))
              )}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewWeekModalOpen(true)}
            className="text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
            {t('driverPayouts.createNewWeek', 'أسبوع جديد')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExcelImportModalOpen(true)}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-300"
          >
            <Upload className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0 text-amber-600" />
            {t('driverPayouts.importExcel', 'استيراد شيت إكسيل')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0 text-emerald-600" />
            {t('driverPayouts.exportExcel', 'تصدير إكسيل')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintReportModalOpen(true)}
            className="text-xs font-bold text-slate-800 hover:bg-slate-100 border-slate-300"
          >
            <Printer className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0 text-slate-600" />
            {t('driverPayouts.printPreview', 'معاينة وطباعة التقرير')}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenNewPayoutModal()}
            className="text-xs font-bold shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
            {t('driverPayouts.recordPayout', 'تسجيل دفعة قبض')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenNewDriverModal}
            className="text-xs font-medium"
          >
            <Users className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
            {t('driverPayouts.addDriver', 'إضافة سائق')}
          </Button>

          <button
            onClick={handleResetZeroData}
            title={t('common.reset', 'تصفير')}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Top 4 KPI Summary Cards */}
      <DriverPayoutKPIs summary={summary} />

      {/* 2. Department Breakdown Banner (Admin vs Production) */}
      <DriverDepartmentBreakdown summary={summary} />

      {/* 3. Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 print:hidden">
        <button
          onClick={() => setActiveTab('matrix')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all',
            activeTab === 'matrix'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{t('driverPayouts.matrixTab', 'مصفوفة الإكسيل الأسبوعية')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {weeklyData?.columns.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all',
            activeTab === 'transactions'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <CreditCard className="w-4 h-4" />
          <span>{t('driverPayouts.transactionsTab', 'سجل الرحلات والعمليات')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {allTransactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all',
            activeTab === 'drivers'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Users className="w-4 h-4" />
          <span>{t('driverPayouts.driversTab', 'دليل السائقين والأسطول')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {allDrivers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all',
            activeTab === 'analytics'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t('driverPayouts.analyticsTab', 'التحليلات والمقارنات')}</span>
        </button>
      </div>

      {/* Tab 1: Spreadsheet Matrix View */}
      {activeTab === 'matrix' && (
        <DriverMatrixTable
          columns={weeklyData?.columns || []}
          maxRows={weeklyData?.maxRows || 4}
          summary={summary}
          onEditTx={handleOpenEditPayoutModal}
          onAddTxForDriver={handleOpenNewPayoutModal}
          onOpenDriverModal={handleOpenNewDriverModal}
          onOpenImportModal={() => setIsExcelImportModalOpen(true)}
          onEditDriver={handleOpenEditDriverModal}
        />
      )}

      {/* Tab 2: Detailed Transactions Table */}
      {activeTab === 'transactions' && (
        <DriverTransactionsTable
          transactions={filteredTransactions}
          drivers={allDrivers}
          search={txSearch}
          onSearchChange={setTxSearch}
          driverFilter={txDriverFilter}
          onDriverFilterChange={setTxDriverFilter}
          categoryFilter={txCategoryFilter}
          onCategoryFilterChange={setTxCategoryFilter}
          onNewPayout={() => handleOpenNewPayoutModal()}
          onEditTx={handleOpenEditPayoutModal}
          onDeleteTx={tx => setTxToDelete(tx)}
        />
      )}

      {/* Tab 3: Drivers Roster Grid */}
      {activeTab === 'drivers' && (
        <DriverRosterGrid
          drivers={allDrivers}
          columns={weeklyData?.columns || []}
          onAddDriver={handleOpenNewDriverModal}
          onEditDriver={handleOpenEditDriverModal}
          onQuickPayout={handleOpenNewPayoutModal}
        />
      )}

      {/* Tab 4: Analytics Charts */}
      {activeTab === 'analytics' && (
        <DriverAnalyticsCharts
          summary={summary}
          columns={weeklyData?.columns || []}
        />
      )}

      {/* Modal 1: Add / Edit Payout Transaction */}
      <PayoutFormModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        isEdit={!!selectedTxForEdit}
        formData={payoutForm}
        onChange={setPayoutForm}
        onSubmit={handleSavePayout}
        drivers={allDrivers}
      />

      {/* Modal 2: Add / Edit Driver */}
      <DriverFormModal
        isOpen={isDriverModalOpen}
        onClose={() => {
          setIsDriverModalOpen(false);
          setSelectedDriverForEdit(null);
        }}
        isEdit={!!selectedDriverForEdit}
        formData={driverForm}
        onChange={setDriverForm}
        onSubmit={handleSaveDriver}
      />

      {/* Modal 3: New Week Cycle */}
      <NewWeekModal
        isOpen={isNewWeekModalOpen}
        onClose={() => setIsNewWeekModalOpen(false)}
        date={newWeekDate}
        onDateChange={setNewWeekDate}
        label={newWeekLabel}
        onLabelChange={setNewWeekLabel}
        onSubmit={handleCreateNewWeek}
      />

      {/* Confirm Delete Transaction Dialog */}
      <ConfirmDialog
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleDeletePayoutConfirm}
        title={t('driverPayouts.confirmDeleteTitle', 'تأكيد حذف دفعة القبض')}
        message={t('driverPayouts.confirmDeleteMsg', {
          name: txToDelete?.driverName || '',
          amount: txToDelete?.amount?.toLocaleString() || '0',
          defaultValue: `هل أنت متأكد من حذف دفعة القبض للسائق "${txToDelete?.driverName}" بقيمة ${txToDelete?.amount?.toLocaleString()} جنيه؟`,
        })}
        isDestructive={true}
      />

      {/* Modal 4: Excel Import & Upload Modal */}
      <DriverExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImportSuccess={importedWeek => {
          setSelectedWeek(importedWeek);
          queryClient.invalidateQueries({ queryKey: driverKeys.all });
        }}
      />

      {/* Modal 5: Print Preview & Report Modal */}
      <DriverPrintReportModal
        isOpen={isPrintReportModalOpen}
        onClose={() => setIsPrintReportModalOpen(false)}
        columns={weeklyData?.columns || []}
        maxRows={weeklyData?.maxRows || 4}
        summary={summary}
      />
    </div>
  );
};
