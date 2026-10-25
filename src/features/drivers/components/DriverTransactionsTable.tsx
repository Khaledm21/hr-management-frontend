import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Driver, DriverPayoutTransaction } from '../../../types/driverPayouts';
import { cn } from '../../../lib/utils';

interface DriverTransactionsTableProps {
  transactions: DriverPayoutTransaction[];
  drivers: Driver[];
  search: string;
  onSearchChange: (val: string) => void;
  driverFilter: string;
  onDriverFilterChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  onNewPayout: () => void;
  onEditTx: (tx: DriverPayoutTransaction) => void;
  onDeleteTx: (tx: DriverPayoutTransaction) => void;
}

export const DriverTransactionsTable: React.FC<DriverTransactionsTableProps> = ({
  transactions,
  drivers,
  search,
  onSearchChange,
  driverFilter,
  onDriverFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onNewPayout,
  onEditTx,
  onDeleteTx,
}) => {
  const { t } = useTranslation();

  return (
    <Card className="border-slate-200 dark:border-[#1E293B] shadow-sm bg-white dark:bg-[#151D2E] transition-colors">
      <CardHeader className="p-4 border-b border-slate-200 dark:border-[#1E293B]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
              {t('driverPayouts.transactionsTab', 'سجل الرحلات والعمليات')}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {t('driverPayouts.transactionsSubtitle', 'كافة الحركات المالية وتفاصيل مشاوير السائقين مع بيان القسم وحالة الدفع')}
            </CardDescription>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 rtl:right-3 rtl:left-auto left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={t('driverPayouts.searchPlaceholder', 'بحث باسم السائق، البيان، اللوحة...')}
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl pr-8 rtl:pr-8 pl-3 py-1.5 focus:bg-white dark:focus:bg-[#0B0F19] focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>

            <select
              value={driverFilter}
              onChange={e => onDriverFilterChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-slate-800 dark:text-slate-200 [&>option]:bg-white [&>option]:dark:bg-[#151D2E] rounded-xl px-3 py-1.5 font-medium transition-colors"
            >
              <option value="all">{t('common.all', 'الكل')}</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={e => onCategoryFilterChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-slate-800 dark:text-slate-200 [&>option]:bg-white [&>option]:dark:bg-[#151D2E] rounded-xl px-3 py-1.5 font-medium transition-colors"
            >
              <option value="all">{t('common.all', 'الكل')}</option>
              <option value="management">{t('driverPayouts.managementCategory')}</option>
              <option value="production">{t('driverPayouts.productionCategory')}</option>
            </select>

            <Button variant="primary" size="sm" onClick={onNewPayout} className="text-xs font-bold">
              <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
              {t('driverPayouts.recordPayout')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-[#1E293B] text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] transition-colors">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">{t('driverPayouts.driverName')}</th>
                <th className="py-3 px-4">{t('driverPayouts.amount')}</th>
                <th className="py-3 px-4">{t('driverPayouts.defaultCategory')}</th>
                <th className="py-3 px-4">{t('driverPayouts.date')}</th>
                <th className="py-3 px-4">{t('driverPayouts.notes')}</th>
                <th className="py-3 px-4">{t('driverPayouts.vehicle')}</th>
                <th className="py-3 px-4">{t('driverPayouts.paymentMethod')}</th>
                <th className="py-3 px-4 text-center">{t('common.actions', 'الإجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1E293B] transition-colors">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    {t('driverPayouts.noTransactions')}
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {tx.receiptNumber || 'REC-001'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#F8FAFC]">{tx.driverName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'font-black text-sm',
                          tx.category === 'management' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-[#F8FAFC]'
                        )}
                      >
                        {tx.amount.toLocaleString()} {t('driverPayouts.egp')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {tx.category === 'management' ? (
                        <Badge variant="danger" className="text-[10px] font-bold">
                          {t('driverPayouts.managementCategory')}
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px] font-bold">
                          {t('driverPayouts.productionCategory')}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{tx.date}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={tx.description}>
                      {tx.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{tx.vehiclePlate || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {tx.paymentMethod === 'cash'
                          ? t('driverPayouts.paymentCash')
                          : tx.paymentMethod === 'transfer'
                          ? t('driverPayouts.paymentTransfer')
                          : t('driverPayouts.paymentCheque')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditTx(tx)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title={t('driverPayouts.edit')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTx(tx)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title={t('driverPayouts.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
