import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { DriverWeeklyColumn, WeeklyPayoutSummary } from '../../../types/driverPayouts';

interface DriverAnalyticsChartsProps {
  summary: WeeklyPayoutSummary | null | undefined;
  columns: DriverWeeklyColumn[];
}

export const DriverAnalyticsCharts: React.FC<DriverAnalyticsChartsProps> = ({ summary, columns }) => {
  const { t } = useTranslation();

  const categoryChartData = useMemo(() => {
    if (!summary || (summary.managementTotal === 0 && summary.productionTotal === 0)) {
      return [];
    }
    return [
      { name: t('driverPayouts.managementCategory', 'الإدارة'), value: summary.managementTotal, color: '#dc2626' },
      { name: t('driverPayouts.productionCategory', 'الإنتاج'), value: summary.productionTotal, color: '#f97316' },
    ];
  }, [summary, t]);

  const topDriversChartData = useMemo(() => {
    if (!columns || columns.length === 0) return [];
    return [...columns]
      .filter(c => c.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 8)
      .map(col => ({
        name: col.driver.name,
        amount: col.totalAmount,
        operations: col.operationsCount,
      }));
  }, [columns]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Category Share Pie Chart */}
      <Card className="border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] transition-colors">
        <CardHeader className="p-4 border-b border-slate-100 dark:border-[#1E293B]">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
            {t('driverPayouts.chartCategoryDistribution', 'نسبة توزيع المبالغ بين الإدارة والإنتاج')}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            {t('driverPayouts.chartCategorySubtitle', 'مقارنة مالية لحصص الأقسام في إجمالي الدفعات')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {categoryChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
              {t('driverPayouts.chartNoCategoryData', 'لا توجد مبالغ مدفوعة بعد لعرض النسب')}
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(1)}%)`}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151D2E', borderColor: '#1E293B', borderRadius: '12px', color: '#F8FAFC' }}
                    itemStyle={{ color: '#F8FAFC' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} ${t('driverPayouts.egp', 'جنيه')}`, t('driverPayouts.amount', 'المبلغ')]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-[#1E293B] text-center">
            <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 transition-colors">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                {t('driverPayouts.managementTotal', 'إجمالي الإدارة')}
              </span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400 block mt-1">
                {(summary?.managementTotal || 0).toLocaleString()} {t('driverPayouts.egp', 'ج.م')}
              </span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50 transition-colors">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                {t('driverPayouts.productionTotal', 'إجمالي الإنتاج')}
              </span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 block mt-1">
                {(summary?.productionTotal || 0).toLocaleString()} {t('driverPayouts.egp', 'ج.م')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart 2: Top Drivers Bar Chart */}
      <Card className="border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] transition-colors">
        <CardHeader className="p-4 border-b border-slate-100 dark:border-[#1E293B]">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
            {t('driverPayouts.chartTopDrivers', 'أعلى السائقين استحقاقاً خلال الأسبوع')}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            {t('driverPayouts.chartTopDriversSubtitle', 'ترتيب السائقين الأعلى قبضاً وفقاً لمجموع الرحلات والدفعات')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {topDriversChartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
              {t('driverPayouts.chartNoDriversData', 'لا توجد دفعات مسجلة بعد لعرض الترتيب')}
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topDriversChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis type="number" tickFormatter={(v: any) => `${v.toLocaleString()}`} tick={{ fill: '#94A3B8' }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151D2E', borderColor: '#1E293B', borderRadius: '12px', color: '#F8FAFC' }}
                    itemStyle={{ color: '#F8FAFC' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} ${t('driverPayouts.egp', 'جنيه')}`, t('driverPayouts.chartTotalPayoutLabel', 'إجمالي القبض')]}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
