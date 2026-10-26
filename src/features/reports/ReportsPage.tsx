import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  PieChart as PieIcon,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { reportService, availableReports, ReportConfig } from '../../services/reportService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { downloadCSV } from '../../lib/utils';
import { useDirection } from '../../context/DirectionContext';

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useDirection();

  const [selectedReportId, setSelectedReportId] = useState<string>('rep-headcount');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeReportConfig = availableReports.find(r => r.id === selectedReportId) || availableReports[0];

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const data = await reportService.generateReportData(selectedReportId, selectedDept);
      setReportData(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [selectedReportId, selectedDept]);

  const handleExport = () => {
    if (reportData && reportData.tableRows) {
      downloadCSV(`ApexHR_Report_${selectedReportId}`, reportData.tableRows);
    }
  };

  const getLocalizedReportName = (r: ReportConfig) => {
    if (language === 'ar') return r.nameAr;
    if (language === 'zh-CN') return r.nameZh;
    return r.name;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>{t('reports.title', 'التقارير التحليلية والذكاء المؤسسي')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('reports.subtitle', 'لوحات معلومات تحليلية وتوليد كشوفات متقدمة للقوى العاملة والماليات')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          {t('common.export', 'تصدير البيانات')}
        </Button>
      </div>

      {/* Grid: Left Reports List / Right Analytics & Data */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: 10 Reports Selector */}
        <div className="lg:col-span-1 space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('reports.availableTemplates', 'نماذج التقارير المعتمدة')}
            </span>
          </div>

          <div className="bg-white dark:bg-[#151D2E] rounded-2xl border border-slate-200 dark:border-[#1E293B] p-2 space-y-1.5 shadow-sm">
            {availableReports.map(rep => {
              const isSelected = rep.id === selectedReportId;
              return (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`w-full text-left rtl:text-right p-3 rounded-xl text-xs transition-all flex flex-col ${
                    isSelected
                      ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-500/20'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E293B]/70'
                  }`}
                >
                  <span className="block leading-tight font-medium">{getLocalizedReportName(rep)}</span>
                  <span
                    className={`text-[10px] capitalize mt-1 ${
                      isSelected ? 'text-brand-100' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {t('reports.category', 'الفئة')}: {rep.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Report View */}
        <div className="lg:col-span-3 space-y-5">
          {/* Scope and Filter Bar */}
          <div className="p-3.5 bg-white dark:bg-[#151D2E] rounded-xl border border-slate-200 dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('reports.departmentScope', 'نطاق الإدارة / القسم')}:
              </span>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-xs [&>option]:bg-white [&>option]:dark:bg-[#151D2E]"
              >
                <option value="all">{t('reports.allDepartments', 'جميع الإدارات (على مستوى الشركة)')}</option>
                {mockDepartments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
              <span>{t('reports.activeTemplate', 'النموذج النشط')}:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#0B0F19] px-2 py-0.5 rounded border border-slate-200 dark:border-[#1E293B]">
                {getLocalizedReportName(activeReportConfig)}
              </span>
            </div>
          </div>

          {/* KPI Summary Cards */}
          {reportData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, val]: any) => (
                <Card key={key} className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize block truncate">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1 block">
                      {String(val)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Chart Section */}
          {reportData?.chartData && (
            <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
              <CardHeader className="border-b border-slate-100 dark:border-[#1E293B] pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>{t('reports.visualAnalytics', 'التحليل البياني والتوزيع الإحصائي')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" strokeOpacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#151D2E', 
                          borderColor: '#1E293B', 
                          borderRadius: '12px', 
                          color: '#F8FAFC',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                        }} 
                      />
                      <Bar dataKey={reportData.chartData[0]?.count !== undefined ? 'count' : 'value'} fill="#0284c7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Data Table */}
          {reportData?.tableRows && (
            <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
              <CardHeader className="border-b border-slate-100 dark:border-[#1E293B] pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('reports.tableRecords', 'جدول السجلات المفصلة')} ({reportData.tableRows.length} {t('common.records', 'سجل')})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead className="bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400 uppercase font-semibold">
                    <tr>
                      {Object.keys(reportData.tableRows[0] || {}).map(header => (
                        <th key={header} className="p-3 whitespace-nowrap capitalize">
                          {header.replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] text-slate-700 dark:text-slate-300">
                    {reportData.tableRows.slice(0, 15).map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/40 transition-colors">
                        {Object.values(row).map((val: any, cIdx: number) => (
                          <td key={cIdx} className="p-3 whitespace-nowrap font-medium">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
export default ReportsPage;
