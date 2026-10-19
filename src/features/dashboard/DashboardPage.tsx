import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserPlus,
  CalendarOff,
  FileWarning,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  Calendar,
  Filter,
  Truck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  useEmployees,
  useDepartments,
  useWeeklySummaries,
  useDashboardStats,
  useAuditLogs,
} from '../../hooks/queries';

export const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('month');

  // React Query cached hooks
  const { data: dashboardStats = null } = useDashboardStats();
  const { data: employeesResponse } = useEmployees({ pageSize: 500 });
  const employeesList = employeesResponse?.data ?? [];
  const { data: departments = [] } = useDepartments();
  const { data: weeklySummaries = [] } = useWeeklySummaries();
  const driverSummary = weeklySummaries.length > 0 ? weeklySummaries[0] : null;
  const { data: rawAuditLogs = [] } = useAuditLogs();
  const auditLogs = useMemo(() => rawAuditLogs.slice(0, 4), [rawAuditLogs]);

  // Filtered dataset for local drill-downs
  const filteredEmployees = useMemo(() => {
    return employeesList.filter(emp => {
      if (selectedDept !== 'all' && emp.departmentId !== selectedDept && emp.departmentName !== selectedDept) return false;
      if (selectedStatus !== 'all' && emp.employmentStatus !== selectedStatus) return false;
      return true;
    });
  }, [employeesList, selectedDept, selectedStatus]);

  const isDefaultFilter = selectedDept === 'all' && selectedStatus === 'all';

  // Real KPIs (using backend stats as primary source of truth)
  const totalEmployees = isDefaultFilter && dashboardStats?.totalEmployees !== undefined
    ? dashboardStats.totalEmployees
    : (employeesResponse?.total ?? filteredEmployees.length);

  const activeEmployees = isDefaultFilter && dashboardStats?.activeEmployees !== undefined
    ? dashboardStats.activeEmployees
    : filteredEmployees.filter(e => e.employmentStatus === 'active').length;

  const newEmployeesThisMonth = isDefaultFilter && dashboardStats?.newEmployeesThisMonth !== undefined
    ? dashboardStats.newEmployeesThisMonth
    : filteredEmployees.filter(e => {
        if (!e.hireDate) return false;
        const now = new Date();
        const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return e.hireDate.startsWith(prefix);
      }).length;

  const onLeaveEmployees = isDefaultFilter && dashboardStats?.onLeaveEmployees !== undefined
    ? dashboardStats.onLeaveEmployees
    : filteredEmployees.filter(e => e.employmentStatus === 'on_leave').length;

  const missingDocsCount = isDefaultFilter && dashboardStats?.missingDocsCount !== undefined
    ? dashboardStats.missingDocsCount
    : filteredEmployees.filter(e => (e.missingDocumentsCount || 0) > 0).length;

  const expiringContractsCount = filteredEmployees.filter(e => e.contractStatus === 'expiring_soon' || e.contractStatus === 'expired').length;
  const pendingApprovalsCount = dashboardStats?.pendingApprovalsCount ?? 0;

  // Driver Payouts KPIs (from backend stats or weekly summaries)
  const driverWeeklyTotal = dashboardStats?.driverWeeklyTotal ?? (driverSummary?.totalAmount || 0);
  const driverCount = dashboardStats?.driverCount ?? (driverSummary?.totalDrivers || 0);

  // Chart 1: Headcount by Department (from live backend stats when available)
  const headcountByDeptData = useMemo(() => {
    if (isDefaultFilter && dashboardStats?.headcountByDept?.length) {
      return dashboardStats.headcountByDept.map(d => ({
        name: d.code,
        fullName: i18n.language === 'ar' ? (d.nameAr || d.name) : (i18n.language === 'zh' ? (d.nameZh || d.name) : d.name),
        count: d.count,
      }));
    }
    return departments.map(d => ({
      name: d.code,
      fullName: i18n.language === 'ar' ? (d.nameAr || d.name) : (i18n.language === 'zh' ? (d.nameZh || d.name) : d.name),
      count: filteredEmployees.filter(e => e.departmentId === d.id || e.departmentName === d.name).length,
    }));
  }, [isDefaultFilter, dashboardStats, departments, filteredEmployees, i18n.language]);

  // Chart 2: Status Distribution (from live backend stats when available)
  const statusDistData = useMemo(() => {
    if (isDefaultFilter && dashboardStats?.statusDistribution?.length) {
      const colorMap: Record<string, string> = {
        active: '#0284c7',
        probation: '#eab308',
        on_leave: '#8b5cf6',
        suspended: '#f43f5e',
        terminated: '#64748b',
      };
      const nameMap: Record<string, string> = {
        active: t('common.active', 'نشط'),
        probation: t('common.probation', 'فترة تجربة'),
        on_leave: t('common.onLeave', 'في إجازة'),
        suspended: t('common.suspended', 'موقوف'),
        terminated: t('common.terminated', 'منتهي التعاقد'),
      };
      return dashboardStats.statusDistribution.map(s => ({
        name: nameMap[s.status] || s.status,
        value: s.count,
        color: colorMap[s.status] || '#94a3b8',
      }));
    }
    const statuses = [
      { key: 'active', name: t('common.active', 'نشط'), color: '#0284c7' },
      { key: 'probation', name: t('common.probation', 'فترة تجربة'), color: '#eab308' },
      { key: 'on_leave', name: t('common.onLeave', 'في إجازة'), color: '#8b5cf6' },
      { key: 'suspended', name: t('common.suspended', 'موقوف'), color: '#f43f5e' },
    ];
    return statuses.map(s => ({
      name: s.name,
      value: filteredEmployees.filter(e => e.employmentStatus === s.key).length,
      color: s.color,
    }));
  }, [isDefaultFilter, dashboardStats, filteredEmployees, t]);

  // Top 5 Recent Employees
  const recentEmployees = useMemo(() => {
    return [...filteredEmployees]
      .sort((a, b) => new Date(b.hireDate || '').getTime() - new Date(a.hireDate || '').getTime())
      .slice(0, 5);
  }, [filteredEmployees]);

  // Missing documents list
  const missingDocsList = useMemo(() => {
    return filteredEmployees.filter(e => (e.missingDocumentsCount || 0) > 0).slice(0, 4);
  }, [filteredEmployees]);

  const getLocalizedDeptName = (deptId: string, fallback: string) => {
    const d = departments.find(item => item.id === deptId || item.name === fallback);
    if (!d) return fallback || 'غير محدد';
    if (i18n.language === 'ar') return d.nameAr || d.name;
    if (i18n.language === 'zh') return d.nameZh || d.name;
    return d.name;
  };

  const getLocalizedEmpName = (emp: any) => {
    if (i18n.language === 'ar' && emp.arabicName) return emp.arabicName;
    if (i18n.language === 'zh' && emp.chineseName) return emp.chineseName;
    return `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'موظف';
  };

  const getLocalizedStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      active: t('common.active', 'نشط'),
      probation: t('common.probation', 'فترة تجربة'),
      on_leave: t('common.onLeave', 'في إجازة'),
      suspended: t('common.suspended', 'موقوف'),
      terminated: t('common.terminated', 'منتهي التعاقد'),
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('dashboard.title', 'لوحة التحكم والمؤشرات')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('dashboard.subtitle', 'نظرة شاملة ومحدثة لحظياً على مؤشرات الموارد البشرية والأسطول والعمليات')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-sm text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">{t('dashboard.allDepartments', 'جميع الأقسام')}</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {i18n.language === 'ar' ? (d.nameAr || d.name) : d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-sm text-xs">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">{t('dashboard.allStatuses', 'كافة الحالات')}</option>
              <option value="active">{t('common.active', 'نشط')}</option>
              <option value="probation">{t('common.probation', 'فترة تجربة')}</option>
              <option value="on_leave">{t('common.onLeave', 'إجازة')}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-sm text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="month">{t('dashboard.currentMonth', 'الشهر الحالي')}</option>
              <option value="quarter">{t('dashboard.q1', 'الربع الأول')}</option>
              <option value="year">{t('dashboard.fullYear', 'العام الحالي')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <Card
          hoverable
          onClick={() => navigate('/employees')}
          className="cursor-pointer border-slate-200"
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('dashboard.kpiTotal', 'إجمالي الموظفين')}
              </span>
              <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{totalEmployees}</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                مربوط حي
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Active Employees */}
        <Card
          hoverable
          onClick={() => navigate('/employees')}
          className="cursor-pointer border-slate-200"
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('dashboard.kpiActive', 'الموظفون على رأس العمل')}
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{activeEmployees}</span>
              <span className="text-[11px] text-slate-400">
                {Math.round((activeEmployees / (totalEmployees || 1)) * 100)}% {t('dashboard.ofTotal', 'من الإجمالي')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Driver Payouts KPI Card */}
        <Card
          hoverable
          onClick={() => navigate('/driver-payouts')}
          className="cursor-pointer border-slate-200 bg-gradient-to-br from-amber-50/40 to-white"
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                قبض السواقين (الأسبوع الأخير)
              </span>
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-900">
                {driverWeeklyTotal ? `${driverWeeklyTotal.toLocaleString()} ج` : '0 ج'}
              </span>
              <Badge variant="warning">{driverCount} سائق</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Missing Documents */}
        <Card
          hoverable
          onClick={() => navigate('/documents')}
          className="cursor-pointer border-slate-200"
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('dashboard.kpiMissingDocs', 'نواقص المستندات')}
              </span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <FileWarning className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{missingDocsCount}</span>
              <Badge variant={missingDocsCount > 0 ? 'danger' : 'success'}>
                {missingDocsCount > 0 ? t('dashboard.actionRequired', 'مطلوب استكمال') : 'مكتمل'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Headcount by Department */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-4 px-5">
            <CardTitle className="text-sm font-bold text-slate-900">
              {t('dashboard.headcountByDept', 'توزيع القوى العاملة حسب الأقسام')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('dashboard.headcountDesc', 'توزيع الموظفين الفعلي على الأقسام المعتمدة')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {headcountByDeptData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                لا توجد بيانات أقسام مسجلة حتى الآن
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={headcountByDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: any, _: any, item: any) => [
                        `${value} ${t('common.staff', 'موظف')}`,
                        item.payload.fullName || item.payload.name,
                      ]}
                    />
                    <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="py-4 px-5">
            <CardTitle className="text-sm font-bold text-slate-900">
              {t('dashboard.statusDistribution', 'توزيع الحالات الوظيفية')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('dashboard.statusDesc', 'نسبة الموظفين حسب الحالة')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            {totalEmployees === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                لا توجد بيانات موظفين مسجلة
              </div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {statusDistData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 text-[11px] mt-2">
                  {statusDistData.map(item => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operational Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Widget 1: Driver Payouts Quick Glance */}
        <Card>
          <CardHeader className="py-3 px-5 border-b border-slate-100">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>شيت قبض السواقين</span>
              </CardTitle>
              <button
                onClick={() => navigate('/driver-payouts')}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center"
              >
                فتح المصفوفة <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 rtl:ml-0.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {driverSummary ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">فترة الأسبوع:</span>
                  <span className="font-bold text-slate-800">{driverSummary.weekLabel || driverSummary.weekPeriod}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">إجمالي المبلغ المنصرف:</span>
                  <span className="font-black text-emerald-700">{driverSummary.totalAmount?.toLocaleString()} جنيه</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">عدد السائقين المشاركين:</span>
                  <Badge variant="warning">{driverSummary.totalDrivers} سائق</Badge>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-rose-700 font-semibold">إدارة: {driverSummary.managementTotal?.toLocaleString()} ج</span>
                  <span className="text-slate-700 font-semibold">إنتاج: {driverSummary.productionTotal?.toLocaleString()} ج</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                لا توجد بيانات أسبوعية مسجلة حالياً
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 2: Missing Documents Attention */}
        <Card>
          <CardHeader className="py-3 px-5 border-b border-slate-100">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-sm font-bold text-slate-900">
                {t('dashboard.missingDocsWidget', 'نواقص أوراق التعيين')}
              </CardTitle>
              <button
                onClick={() => navigate('/documents')}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center"
              >
                مراجعة الملفات <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 rtl:ml-0.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-3 divide-y divide-slate-100">
            {missingDocsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                جميع ملفات الموظفين مكتملة
              </div>
            ) : (
              missingDocsList.map(emp => (
                <div key={emp.id} className="py-2.5 px-2 hover:bg-slate-50/80 rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      {getLocalizedEmpName(emp)}
                    </span>
                    <Badge variant="danger">{emp.missingDocumentsCount} نواقص</Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>{getLocalizedDeptName(emp.departmentId, emp.departmentName)}</span>
                    <span>{emp.documentCompletenessPercentage}% مكتمل</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Widget 3: Recent HR Activity Log */}
        <Card>
          <CardHeader className="py-3 px-5 border-b border-slate-100">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-sm font-bold text-slate-900">
                {t('dashboard.recentActivity', 'سجل العمليات الأخير')}
              </CardTitle>
              <button
                onClick={() => navigate('/audit-logs')}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center"
              >
                عرض الكل <ChevronRight className="w-3.5 h-3.5 mr-0.5 rtl:ml-0.5 rtl:rotate-180" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                لا توجد سجلات نشاط مسجلة
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="text-xs border-l-2 border-brand-500 pl-3 rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-3 py-0.5">
                    <div className="font-semibold text-slate-800">{log.action}</div>
                    <div className="text-[11px] text-slate-500 truncate">{log.target}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {log.userName} • {log.timestamp.split(' ')[1] || log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
