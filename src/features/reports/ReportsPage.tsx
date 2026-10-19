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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { reportService, availableReports, ReportConfig } from '../../services/reportService';
import { mockDepartments } from '../../mocks/departments';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('reports.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('reports.subtitle')}</p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          {t('common.export')}
        </Button>
      </div>

      {/* Grid: Left Reports List / Right Analytics & Data */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: 10 Reports Selector */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            Available Report Templates
          </span>
          <div className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-sm">
            {availableReports.map(rep => {
              const isSelected = rep.id === selectedReportId;
              return (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`w-full text-left rtl:text-right p-3 rounded-xl text-xs transition-all flex flex-col ${
                    isSelected
                      ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-500/20'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block leading-tight">{getLocalizedReportName(rep)}</span>
                  <span
                    className={`text-[10px] capitalize mt-1 ${
                      isSelected ? 'text-brand-100' : 'text-slate-400'
                    }`}
                  >
                    Category: {rep.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Report View */}
        <div className="lg:col-span-3 space-y-5">
          {/* Filter Bar */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Department Scope:</span>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="all">All Departments (Enterprise-wide)</option>
                {mockDepartments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[11px] text-slate-400">
              Template: <span className="font-semibold text-slate-700">{activeReportConfig.name}</span>
            </span>
          </div>

          {/* KPI Summary Cards */}
          {reportData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, val]: any) => (
                <Card key={key}>
                  <CardContent className="p-4">
                    <span className="text-[11px] font-semibold text-slate-400 capitalize block truncate">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block">
                      {String(val)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Chart Section */}
          {reportData?.chartData && (
            <Card>
              <CardHeader>
                <CardTitle>Visual Distribution Analytics</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey={reportData.chartData[0]?.count !== undefined ? 'count' : 'value'} fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Data Table */}
          {reportData?.tableRows && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Tabular Records ({reportData.tableRows.length} sample rows)</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      {Object.keys(reportData.tableRows[0] || {}).map(header => (
                        <th key={header} className="p-3 whitespace-nowrap capitalize">
                          {header.replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {reportData.tableRows.slice(0, 15).map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {Object.values(row).map((val: any, cIdx: number) => (
                          <td key={cIdx} className="p-3 whitespace-nowrap">
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
