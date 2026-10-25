import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Users, Plus, Edit2, Upload, Download, Trash2 } from 'lucide-react';
import { Driver, DriverWeeklyColumn, DriverPayoutTransaction, WeeklyPayoutSummary } from '../../../types/driverPayouts';
import { driverPayoutService } from '../../../services/driverPayoutService';
import { cn } from '../../../lib/utils';

interface DriverMatrixTableProps {
  columns: DriverWeeklyColumn[];
  maxRows: number;
  summary: WeeklyPayoutSummary | null | undefined;
  onEditTx: (tx: DriverPayoutTransaction) => void;
  onDeleteTx?: (tx: DriverPayoutTransaction) => void;
  onAddTxForDriver: (driverId: string) => void;
  onOpenDriverModal: () => void;
  onOpenImportModal?: () => void;
  onEditDriver?: (driver: Driver) => void;
  onDeleteDriver?: (driver: Driver) => void;
}

export const DriverMatrixTable: React.FC<DriverMatrixTableProps> = ({
  columns,
  maxRows,
  summary,
  onEditTx,
  onDeleteTx,
  onAddTxForDriver,
  onOpenDriverModal,
  onOpenImportModal,
  onEditDriver,
  onDeleteDriver,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  if (!columns || columns.length === 0) {
    return (
      <Card className="border-slate-200 dark:border-[#1E293B] shadow-sm p-12 text-center bg-white dark:bg-[#151D2E] transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-[#F8FAFC]">
          {t('driverPayouts.noDrivers', 'لا توجد بيانات سواقين مسجلة حتى الآن')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-1 mb-6 leading-relaxed">
          {t(
            'driverPayouts.zeroStateDesc',
            'النظام الآن خالي تماماً من أي بيانات وهمية. يمكنك استيراد شيت الإكسيل الأسبوعي المعتمد أو تحميل النموذج الرسمي لتعبئته ورفعه.'
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onOpenImportModal && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenImportModal}
              className="font-bold shadow-md shadow-brand-500/20"
            >
              <Upload className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              {t('driverPayouts.importExcel', 'استيراد شيت إكسيل')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => driverPayoutService.downloadTemplateExcel()}
            className="font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-300 dark:border-amber-900/50"
          >
            <Download className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-amber-600 dark:text-amber-400" />
            {t('driverPayouts.downloadTemplate', 'تحميل النموذج الرسمي المعتمد (.xlsx)')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDriverModal}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
            {t('driverPayouts.addDriver', 'إضافة سائق يدوياً')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/90 dark:border-[#1E293B] shadow-sm overflow-hidden bg-white dark:bg-[#151D2E] transition-colors">
      {/* Official Sheet Title Banner */}
      <div className="bg-[#1f4e79] dark:bg-[#0f273d] text-white py-3 px-4 text-center border-b border-[#163857] dark:border-[#0c2033]">
        <h2 className="text-base md:text-lg font-black tracking-wide">
          {t('driverPayouts.weeklySheetTitle', 'الملخص الأسبوعي - متابعة قبض السواقين')}
        </h2>
      </div>

      <CardHeader className="p-3.5 bg-slate-50/90 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2">
          <span className="bg-[#bdd7ee] dark:bg-[#1e3a5f] text-slate-900 dark:text-slate-100 border border-blue-400 dark:border-blue-500/50 font-black text-xs px-3 py-1 rounded-lg shadow-xs">
            {summary?.weekLabel || summary?.weekPeriod || t('driverPayouts.matrixTab')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            {t('driverPayouts.managementCategory', 'إدارة')} ({summary?.managementTotal?.toLocaleString() || 0} {t('driverPayouts.egp', 'جنيه')})
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-slate-600 dark:bg-slate-400" />
            {t('driverPayouts.productionCategory', 'إنتاج')} ({summary?.productionTotal?.toLocaleString() || 0} {t('driverPayouts.egp', 'جنيه')})
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-center border-collapse text-xs select-none">
            {/* Header: Driver Names */}
            <thead>
              <tr className="bg-[#FFC000] dark:bg-[#d97706] text-slate-950 font-black border-b-2 border-amber-600 dark:border-amber-700">
                {columns.map(col => (
                  <th
                    key={col.driver.id}
                    className="py-2.5 px-2.5 min-w-[105px] border-x border-amber-500/80 dark:border-amber-600/80 tracking-tight group relative"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="truncate font-bold text-[13px] flex-1">{col.driver.name}</div>
                      <div className="flex items-center gap-0.5">
                        {onEditDriver && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditDriver(col.driver);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-amber-950 hover:bg-amber-400 dark:hover:bg-amber-500 rounded transition-opacity"
                            title={t('driverPayouts.editDriver', 'تعديل بيانات السائق')}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteDriver && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDriver(col.driver);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-amber-950 hover:bg-rose-600 hover:text-white rounded transition-opacity"
                            title={t('driverPayouts.deleteDriver', 'حذف السائق')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-amber-950 bg-amber-600/20 px-2 py-0.5 rounded border border-amber-700/20 shadow-2xs">
                        {col.driver.vehicleType === 'عربية فان'
                          ? t('driverPayouts.vehicleVan', 'عربية فان')
                          : t('driverPayouts.vehicleMicrobus', 'ميكروباص')}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Payout Values Rows */}
            <tbody className="divide-y divide-slate-200 dark:divide-[#1E293B] bg-white dark:bg-[#151D2E] transition-colors">
              {Array.from({ length: maxRows || 4 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  {columns.map(col => {
                    const tx = col.transactions[rowIndex];
                    const isManagement = tx?.category === 'management';

                    return (
                      <td
                        key={col.driver.id}
                        className={cn(
                          'py-2.5 px-2 border-x border-slate-200/90 dark:border-[#1E293B] text-[13px] font-bold relative group/cell',
                          tx ? 'cursor-pointer hover:bg-amber-50/80 dark:hover:bg-amber-950/30 transition-colors' : 'text-slate-300 dark:text-slate-600'
                        )}
                        onClick={() => {
                          if (tx) {
                            onEditTx(tx);
                          } else {
                            onAddTxForDriver(col.driver.id);
                          }
                        }}
                        title={
                          tx
                            ? `${col.driver.name}: ${tx.amount.toLocaleString()} ${t('driverPayouts.egp')} (${isManagement ? t('driverPayouts.managementCategory') : t('driverPayouts.productionCategory')})`
                            : `${t('driverPayouts.recordPayout')}: ${col.driver.name}`
                        }
                      >
                        {tx ? (
                          <div className="relative inline-flex items-center justify-center">
                            <span
                              className={cn(
                                'inline-block px-1.5 py-0.5 rounded font-black transition-all group-hover/cell:scale-95',
                                isManagement
                                  ? 'text-[#c00000] dark:text-rose-400 bg-rose-50/90 dark:bg-rose-950/60'
                                  : 'text-slate-900 dark:text-[#F8FAFC]'
                              )}
                            >
                              {tx.amount.toLocaleString()}
                            </span>

                            {onDeleteTx && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTx(tx);
                                }}
                                className="opacity-0 group-hover/cell:opacity-100 transition-all duration-150 absolute -top-2.5 rtl:-left-3.5 ltr:-right-3.5 w-5 h-5 rounded-full bg-white dark:bg-[#0B0F19] border border-rose-300 dark:border-rose-800 text-rose-500 hover:text-white hover:bg-rose-600 shadow-sm flex items-center justify-center z-10 hover:scale-110 active:scale-95"
                                title={t('driverPayouts.deletePayoutBtn', 'حذف هذه الدفعة')}
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-normal hover:text-brand-600 dark:hover:text-brand-400 hover:font-bold">
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Quick Add Row */}
              <tr className="bg-slate-50/50 dark:bg-[#0B0F19] border-t border-slate-200 dark:border-[#1E293B]">
                {columns.map(col => (
                  <td key={col.driver.id} className="py-1 px-1 border-x border-slate-200 dark:border-[#1E293B]">
                    <button
                      onClick={() => onAddTxForDriver(col.driver.id)}
                      className="w-full py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-[#151D2E] rounded transition-colors"
                      title={`${t('driverPayouts.addTrip')} - ${col.driver.name}`}
                    >
                      {t('driverPayouts.addTrip')}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Total Payout Row (Green highlight) */}
              <tr className="bg-[#c6efce] dark:bg-[#14532d]/70 text-emerald-950 dark:text-emerald-100 font-black border-t-2 border-emerald-500 dark:border-emerald-600">
                {columns.map(col => (
                  <td
                    key={col.driver.id}
                    className="py-2.5 px-2 border-x border-emerald-400/80 dark:border-emerald-700/60 text-[12px]"
                  >
                    <div className="font-black text-emerald-900 dark:text-emerald-200">
                      {col.totalAmount.toLocaleString()} {t('driverPayouts.egp')}
                    </div>
                    <div className="text-[9px] text-emerald-800/80 dark:text-emerald-300/80 font-bold">{t('driverPayouts.totalPayout')}</div>
                  </td>
                ))}
              </tr>

              {/* Payout Operations Count Row (Light blue highlight) */}
              <tr className="bg-[#ddebf7] dark:bg-[#1e3a8a]/40 text-blue-950 dark:text-blue-100 font-black border-t border-blue-300 dark:border-blue-700">
                {columns.map(col => (
                  <td
                    key={col.driver.id}
                    className="py-2 px-2 border-x border-blue-300/80 dark:border-blue-700/60 text-[12px]"
                  >
                    <div className="font-black text-blue-900 dark:text-blue-200">{col.operationsCount}</div>
                    <div className="text-[9px] text-blue-800/80 dark:text-blue-300/80 font-bold">{t('driverPayouts.tripsCount')}</div>
                  </td>
                ))}
              </tr>

              {/* Spacer empty row */}
              <tr className="h-2 bg-slate-100/60 dark:bg-[#0B0F19]">
                <td colSpan={columns.length} />
              </tr>

              {/* Bottom Master Breakdown Rows - Matching Official Excel Template */}
              {summary && (
                <>
                  {/* 1. Grand Total Row */}
                  <tr className="bg-[#2e6930] dark:bg-[#1b431d] text-white font-black border-t-2 border-emerald-950 dark:border-emerald-900">
                    <td colSpan={columns.length} className="py-2.5 px-4">
                      <div className="flex items-center justify-between max-w-2xl mx-auto">
                        <span className="text-xs md:text-sm font-bold text-emerald-100">
                          {t('driverPayouts.grandTotal', 'الإجمالي العام')}
                        </span>
                        <span className="text-base md:text-xl font-black tracking-wide">
                          {summary.totalAmount.toLocaleString()} {t('driverPayouts.egp', 'جنيه')}
                        </span>
                        <span className="text-[11px] text-emerald-200 font-bold bg-black/20 px-2 py-0.5 rounded">
                          100%
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* 2. Administration Total Row */}
                  <tr className="bg-[#c00000] dark:bg-[#881337] text-white font-black border-t border-rose-950 dark:border-rose-900">
                    <td colSpan={columns.length} className="py-2.5 px-4">
                      <div className="flex items-center justify-between max-w-2xl mx-auto">
                        <span className="text-xs md:text-sm font-bold text-rose-100">
                          {t('driverPayouts.managementTotal', 'اجمالي الاداره')}
                        </span>
                        <span className="text-base md:text-xl font-black tracking-wide">
                          {summary.managementTotal.toLocaleString()} {t('driverPayouts.egp', 'جنيه')}
                        </span>
                        <span className="text-[11px] text-rose-200 font-bold bg-black/20 px-2 py-0.5 rounded">
                          {summary.totalAmount > 0 ? ((summary.managementTotal / summary.totalAmount) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* 3. Production Total Row */}
                  <tr className="bg-[#f8cbad] dark:bg-[#7c2d12] text-slate-900 dark:text-slate-100 font-black border-t border-orange-900">
                    <td colSpan={columns.length} className="py-2.5 px-4">
                      <div className="flex items-center justify-between max-w-2xl mx-auto">
                        <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">
                          {t('driverPayouts.productionTotal', 'اجمالي الإنتاج')}
                        </span>
                        <span className="text-base md:text-xl font-black tracking-wide text-slate-950 dark:text-white">
                          {summary.productionTotal.toLocaleString()} {t('driverPayouts.egp', 'جنيه')}
                        </span>
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold bg-white/40 dark:bg-black/20 px-2 py-0.5 rounded">
                          {summary.totalAmount > 0 ? ((summary.productionTotal / summary.totalAmount) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
