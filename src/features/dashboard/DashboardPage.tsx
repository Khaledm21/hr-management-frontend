import React, { useState, useMemo } from 'react';
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
  CalendarCheck,
  CreditCard,
  Cake,
  Award,
  Sparkles,
  CheckCircle2,
  HeartHandshake,
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
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  useEmployees,
  useDepartments,
  useWeeklySummaries,
  useDashboardStats,
  useAuditLogs,
  useAttendanceStats,
  useCreateEmployeeMutation,
} from '../../hooks/queries';
import { EmployeeFormModal } from '../employees/EmployeeFormModal';
import { Employee } from '../../types';
import { parseEgyptianNationalId } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

export const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { isDark } = useTheme();

  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('month');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  // React Query cached hooks
  const { data: dashboardStats = null } = useDashboardStats();
  const { data: employeesResponse } = useEmployees({ pageSize: 500 });
  const employeesList = employeesResponse?.data ?? [];
  const { data: departments = [] } = useDepartments();
  const { data: weeklySummaries = [] } = useWeeklySummaries();
  const driverSummary = weeklySummaries.length > 0 ? weeklySummaries[0] : null;
  const { data: rawAuditLogs = [] } = useAuditLogs();
  const auditLogs = useMemo(() => rawAuditLogs.slice(0, 4), [rawAuditLogs]);
  const { data: attendanceStats } = useAttendanceStats();
  const createEmployeeMutation = useCreateEmployeeMutation();

  const getLocalizedDeptName = (deptId: string, fallback: string) => {
    const d = departments.find(item => item.id === deptId || item.name === fallback);
    if (!d) return fallback || t('common.unspecified', 'غير محدد');
    if (i18n.language === 'ar') return d.nameAr || d.name;
    if (i18n.language === 'zh') return d.nameZh || d.name;
    return d.name;
  };

  const getLocalizedEmpName = (emp: any) => {
    if (!emp) return t('common.staff', 'موظف');
    if (i18n.language === 'ar' && emp.arabicName) return emp.arabicName;
    if (i18n.language === 'zh' && emp.chineseName) return emp.chineseName;
    return `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || t('common.staff', 'موظف');
  };

  // Filtered dataset for local drill-downs
  const filteredEmployees = useMemo(() => {
    return employeesList.filter(emp => {
      if (selectedDept !== 'all' && emp.departmentId !== selectedDept && emp.departmentName !== selectedDept) return false;
      if (selectedStatus !== 'all' && emp.employmentStatus !== selectedStatus) return false;
      return true;
    });
  }, [employeesList, selectedDept, selectedStatus]);

  const isDefaultFilter = selectedDept === 'all' && selectedStatus === 'all';

  // 1. Real KPIs from live data
  const totalEmployees = isDefaultFilter && dashboardStats?.totalEmployees !== undefined
    ? dashboardStats.totalEmployees
    : (employeesResponse?.total ?? filteredEmployees.length);

  const activeEmployees = isDefaultFilter && dashboardStats?.activeEmployees !== undefined
    ? dashboardStats.activeEmployees
    : filteredEmployees.filter(e => e.employmentStatus === 'active').length;

  const onLeaveEmployees = isDefaultFilter && dashboardStats?.onLeaveEmployees !== undefined
    ? dashboardStats.onLeaveEmployees
    : filteredEmployees.filter(e => e.employmentStatus === 'on_leave').length;

  const missingDocsCount = isDefaultFilter && dashboardStats?.missingDocsCount !== undefined
    ? dashboardStats.missingDocsCount
    : filteredEmployees.filter(e => (e.missingDocumentsCount || 0) > 0).length;

  // 2. Attendance & Punctuality (100% live computed from real records)
  const presentCount = attendanceStats?.present ?? activeEmployees;
  const lateCount = attendanceStats?.late ?? 0;
  const absentCount = attendanceStats?.absent ?? Math.max(0, totalEmployees - activeEmployees - onLeaveEmployees);
  const attendanceRate = attendanceStats?.attendanceRate ?? (totalEmployees > 0 ? Math.round(((presentCount + lateCount) / totalEmployees) * 100) : 100);
  const punctualityRate = (presentCount + lateCount) > 0 ? Math.round((presentCount / (presentCount + lateCount)) * 100) : 100;

  // 3. Gender Diversity (Computed from employee gender & Egyptian National IDs)
  const genderStats = useMemo(() => {
    const total = filteredEmployees.length || 1;
    let males = 0;
    let females = 0;

    filteredEmployees.forEach(e => {
      if (e.gender === 'female') {
        females++;
        return;
      }
      if (e.gender === 'male' && (!e.nationalId || String(e.nationalId).trim().length !== 14)) {
        males++;
        return;
      }
      const parsed = parseEgyptianNationalId(e.nationalId);
      if (parsed) {
        if (parsed.gender === 'female') females++;
        else males++;
      } else {
        males++;
      }
    });

    const femalePct = Math.round((females / total) * 100);
    const malePct = 100 - femalePct;
    return {
      males,
      females,
      malePct,
      femalePct,
      total: filteredEmployees.length,
    };
  }, [filteredEmployees]);

  // 4. Driver Payouts KPIs & Weekly Trend (100% live from weekly cycles)
  const driverWeeklyTotal = dashboardStats?.driverWeeklyTotal ?? (driverSummary?.totalAmount || 0);
  const driverCount = dashboardStats?.driverCount ?? (driverSummary?.totalDrivers || 0);

  const driverTrendData = useMemo(() => {
    if (!weeklySummaries || weeklySummaries.length === 0) return [];
    return [...weeklySummaries]
      .slice(0, 6)
      .reverse()
      .map(s => ({
        period: s.weekPeriod,
        label: s.weekLabel ? s.weekLabel.replace(/^Sunday,\s*/i, '').replace(/^الأحد،\s*/i, '') : s.weekPeriod,
        total: s.totalAmount || 0,
        management: s.managementTotal || 0,
        production: s.productionTotal || 0,
        drivers: s.totalDrivers || 0,
      }));
  }, [weeklySummaries]);

  // 5. Seniority / Tenure Distribution (100% computed from actual hire dates)
  const tenureData = useMemo(() => {
    const now = new Date();
    let lessThan6M = 0;
    let sixMTo1Y = 0;
    let oneTo3Y = 0;
    let moreThan3Y = 0;

    filteredEmployees.forEach(e => {
      if (!e.hireDate) return;
      const hire = new Date(e.hireDate);
      if (isNaN(hire.getTime())) return;
      const diffMonths = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
      if (diffMonths < 6) lessThan6M++;
      else if (diffMonths < 12) sixMTo1Y++;
      else if (diffMonths <= 36) oneTo3Y++;
      else moreThan3Y++;
    });

    return [
      { range: '< 6M', label: t('dashboard.tenureLessThan6M', 'أقل من 6 أشهر'), count: lessThan6M, color: '#06B6D4' },
      { range: '6M - 1Y', label: t('dashboard.tenure6MTo1Y', '6 أشهر - سنة'), count: sixMTo1Y, color: '#0878D1' },
      { range: '1Y - 3Y', label: t('dashboard.tenure1To3Y', '1 - 3 سنوات'), count: oneTo3Y, color: '#8B5CF6' },
      { range: '3Y+', label: t('dashboard.tenureMoreThan3Y', 'أكثر من 3 سنوات'), count: moreThan3Y, color: '#10B981' },
    ];
  }, [filteredEmployees, t]);

  // 6. Upcoming Celebrations (Birthdays & Work Anniversaries next 30 days)
  const upcomingCelebrations = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const todayTimestamp = new Date(currentYear, currentMonth, currentDay).getTime();
    const results: Array<{
      id: string;
      employeeName: string;
      department: string;
      type: 'birthday' | 'anniversary';
      dateStr: string;
      years?: number;
      daysUntil: number;
    }> = [];

    filteredEmployees.forEach(emp => {
      const empName = getLocalizedEmpName(emp);
      const deptName = getLocalizedDeptName(emp.departmentId, emp.departmentName);

      // Birthday
      if (emp.dateOfBirth) {
        const parts = emp.dateOfBirth.split('-');
        if (parts.length >= 3) {
          const bMonth = parseInt(parts[1], 10) - 1;
          const bDay = parseInt(parts[2], 10);
          
          let nextBday = new Date(currentYear, bMonth, bDay);
          if (nextBday.getTime() < todayTimestamp) {
            nextBday = new Date(currentYear + 1, bMonth, bDay);
          }
          const diffDays = Math.round((nextBday.getTime() - todayTimestamp) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 30) {
            results.push({
              id: `bday-${emp.id}`,
              employeeName: empName,
              department: deptName,
              type: 'birthday',
              dateStr: `${bDay}/${bMonth + 1}`,
              daysUntil: diffDays,
            });
          }
        }
      }

      // Work Anniversary
      if (emp.hireDate) {
        const parts = emp.hireDate.split('-');
        if (parts.length >= 3) {
          const hYear = parseInt(parts[0], 10);
          const hMonth = parseInt(parts[1], 10) - 1;
          const hDay = parseInt(parts[2], 10);
          const yearsCompleted = currentYear - hYear;

          if (yearsCompleted > 0) {
            let nextAnniv = new Date(currentYear, hMonth, hDay);
            if (nextAnniv.getTime() < todayTimestamp) {
              nextAnniv = new Date(currentYear + 1, hMonth, hDay);
            }
            const diffDays = Math.round((nextAnniv.getTime() - todayTimestamp) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 30) {
              results.push({
                id: `anniv-${emp.id}`,
                employeeName: empName,
                department: deptName,
                type: 'anniversary',
                dateStr: `${hDay}/${hMonth + 1}`,
                years: yearsCompleted,
                daysUntil: diffDays,
              });
            }
          }
        }
      }
    });

    return results.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
  }, [filteredEmployees, i18n.language]);

  // Chart 1: Headcount by Department
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

  // Chart 2: Status Distribution
  const statusDistData = useMemo(() => {
    if (isDefaultFilter && dashboardStats?.statusDistribution?.length) {
      const colorMap: Record<string, string> = {
        active: '#0878D1',
        probation: '#F59E0B',
        on_leave: '#8B5CF6',
        suspended: '#F43F5E',
        terminated: '#64748B',
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
        color: colorMap[s.status] || '#94A3B8',
      }));
    }
    const statuses = [
      { key: 'active', name: t('common.active', 'نشط'), color: '#0878D1' },
      { key: 'probation', name: t('common.probation', 'فترة تجربة'), color: '#F59E0B' },
      { key: 'on_leave', name: t('common.onLeave', 'في إجازة'), color: '#8B5CF6' },
      { key: 'suspended', name: t('common.suspended', 'موقوف'), color: '#F43F5E' },
    ];
    return statuses.map(s => ({
      name: s.name,
      value: filteredEmployees.filter(e => e.employmentStatus === s.key).length,
      color: s.color,
    }));
  }, [isDefaultFilter, dashboardStats, filteredEmployees, t]);

  // Missing documents list
  const missingDocsList = useMemo(() => {
    return filteredEmployees.filter(e => (e.missingDocumentsCount || 0) > 0).slice(0, 4);
  }, [filteredEmployees]);

  const handleCreateEmployee = async (data: Partial<Employee>) => {
    try {
      await createEmployeeMutation.mutateAsync(data as any);
      success(t('employees.createSuccess', 'تم إضافة الموظف بنجاح إلى قاعدة البيانات.'));
      setIsAddEmployeeOpen(false);
    } catch (err: any) {
      toastError(err.message || t('employees.createFailed', 'فشل في تسجيل الموظف الجديد.'));
    }
  };

  const chartGridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const chartAxisFill = isDark ? '#94A3B8' : '#64748B';
  const chartTooltipStyle = useMemo(
    () => ({
      backgroundColor: isDark ? '#151D2E' : '#FFFFFF',
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      borderRadius: '12px',
      boxShadow: isDark
        ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      color: isDark ? '#F8FAFC' : '#172033',
      fontSize: '12px',
    }),
    [isDark]
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F8FAFC] tracking-tight">
            {t('dashboard.title', 'لوحة التحكم والمؤشرات')}
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
            {t('dashboard.subtitle', 'نظرة شاملة ومحدثة لحظياً على مؤشرات الموارد البشرية والأسطول والعمليات')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#151D2E] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#BFDBFE] dark:hover:border-[#38BDF8]/40 rounded-xl px-2.5 py-1.5 shadow-2xs text-xs transition-colors">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#64748B]" />
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="bg-transparent border-none text-[#172033] dark:text-[#F8FAFC] font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('dashboard.allDepartments', 'جميع الأقسام')}</option>
              {departments.map(d => (
                <option key={d.id} value={d.id} className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">
                  {getLocalizedDeptName(d.id, d.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-[#151D2E] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#BFDBFE] dark:hover:border-[#38BDF8]/40 rounded-xl px-2.5 py-1.5 shadow-2xs text-xs transition-colors">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none text-[#172033] dark:text-[#F8FAFC] font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('dashboard.allStatuses', 'كافة الحالات')}</option>
              <option value="active" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('common.active', 'نشط')}</option>
              <option value="probation" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('common.probation', 'فترة تجربة')}</option>
              <option value="on_leave" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('common.onLeave', 'إجازة')}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-[#151D2E] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#BFDBFE] dark:hover:border-[#38BDF8]/40 rounded-xl px-2.5 py-1.5 shadow-2xs text-xs transition-colors">
            <Calendar className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#64748B]" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="bg-transparent border-none text-[#172033] dark:text-[#F8FAFC] font-medium focus:outline-none cursor-pointer"
            >
              <option value="month" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('dashboard.currentMonth', 'الشهر الحالي')}</option>
              <option value="quarter" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('dashboard.q1', 'الربع الأول')}</option>
              <option value="year" className="dark:bg-[#151D2E] dark:text-[#F8FAFC]">{t('dashboard.fullYear', 'العام الحالي')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR - Dual Theme Responsive */}
      <div className="bg-gradient-to-r from-[#E8F3FF] via-white to-[#F0F7FF] dark:from-[#1E293B] dark:via-[#151D2E] dark:to-[#1E293B] border border-[#BFDBFE] dark:border-[#334155] rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#0B0F19] text-[#0878D1] dark:text-[#38BDF8] border border-[#BFDBFE] dark:border-[#334155] shadow-2xs">
            <Sparkles className="w-5 h-5 text-[#0878D1] dark:text-[#38BDF8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-[#172033] dark:text-[#F8FAFC]">{t('dashboard.quickActions', 'الإجراءات السريعة')}</span>
              <span className="text-[10px] bg-[#E8F3FF] dark:bg-[#0B0F19] text-[#0878D1] dark:text-[#38BDF8] px-2.5 py-0.5 rounded-full font-bold border border-[#BFDBFE] dark:border-[#334155]">
                {t('dashboard.liveOperations', 'عمليات حية')}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              {t('dashboard.quickActionsDesc', 'إجراءات فورية لإضافة العمالة، تسجيل حركات السائقين، والتحكم بالعمليات')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddEmployeeOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0878D1] dark:bg-[#0878D1] hover:bg-[#0667B2] text-white font-semibold text-xs shadow-2xs transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('dashboard.newEmployeeBtn', 'إضافة موظف جديد')}</span>
          </button>

          <button
            onClick={() => navigate('/driver-payouts')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-xs shadow-2xs transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>{t('dashboard.recordDriverPayout', 'تسجيل دفعة سائقين')}</span>
          </button>

          <button
            onClick={() => navigate('/attendance')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-[#F0F7FF] dark:hover:bg-[#334155] text-[#172033] dark:text-[#F8FAFC] font-semibold text-xs border border-[#E2E8F0] dark:border-[#334155] hover:border-[#BFDBFE] dark:hover:border-[#38BDF8]/40 shadow-2xs transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-[#059669] dark:text-emerald-400" />
            <span>{t('dashboard.recordAttendance', 'تسجيل الحضور اليومي')}</span>
          </button>

          <button
            onClick={() => navigate('/advances')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-[#F0F7FF] dark:hover:bg-[#334155] text-[#172033] dark:text-[#F8FAFC] font-semibold text-xs border border-[#E2E8F0] dark:border-[#334155] hover:border-[#BFDBFE] dark:hover:border-[#38BDF8]/40 shadow-2xs transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-[#D97706] dark:text-amber-400" />
            <span>{t('dashboard.requestAdvance', 'طلب سلفة مالية')}</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS (6 Key Pillars) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Employees */}
        <Card hoverable onClick={() => navigate('/employees')} className="cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider truncate">
                {t('dashboard.kpiTotal', 'إجمالي الموظفين')}
              </span>
              <div className="p-2 rounded-xl bg-[#E8F3FF] dark:bg-[#0878D1]/20 text-[#0878D1] dark:text-[#38BDF8]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#172033] dark:text-[#F8FAFC]">{totalEmployees}</span>
              <span className="text-[10px] font-bold text-[#059669] dark:text-emerald-400 bg-[#ECFDF5] dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-[#A7F3D0] dark:border-emerald-800/40">
                {t('dashboard.liveConnected', 'مربوط')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Active Employees */}
        <Card hoverable onClick={() => navigate('/employees')} className="cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider truncate">
                {t('dashboard.kpiActive', 'على رأس العمل')}
              </span>
              <div className="p-2 rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#172033] dark:text-[#F8FAFC]">{activeEmployees}</span>
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-semibold">
                {Math.round((activeEmployees / (totalEmployees || 1)) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance & Punctuality Rate */}
        <Card hoverable onClick={() => navigate('/attendance')} className="cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider truncate">
                {t('dashboard.attendancePunctuality', 'الانضباط والحضور')}
              </span>
              <div className="p-2 rounded-xl bg-[#F0F9FF] dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-400">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#172033] dark:text-[#F8FAFC]">{attendanceRate}%</span>
              <span className="text-[10px] font-bold text-[#0891B2] dark:text-cyan-300 bg-[#F0F9FF] dark:bg-cyan-950/40 px-1.5 py-0.5 rounded-md border border-[#BFDBFE] dark:border-cyan-800/40">
                {t('dashboard.onTimeRate', 'انضباط')} {punctualityRate}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1.5">
              <span className="text-[#059669] dark:text-emerald-400 font-bold">{presentCount} {t('dashboard.presentCount', 'حاضر')}</span>
              <span>•</span>
              <span className="text-[#D97706] dark:text-amber-400 font-semibold">{lateCount} {t('dashboard.lateCount', 'تأخير')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Gender Diversity Ratio */}
        <Card hoverable onClick={() => navigate('/employees')} className="cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider truncate">
                {t('dashboard.genderDiversity', 'التوزيع النوعي')}
              </span>
              <div className="p-2 rounded-xl bg-[#F5F3FF] dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-400">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-sm font-bold text-[#172033] dark:text-[#F8FAFC]">
                {genderStats.malePct}% <span className="text-xs font-normal text-[#64748B] dark:text-[#94A3B8]">{t('dashboard.genderMale', 'ذكور')} ({genderStats.males})</span>
              </span>
              <span className="text-sm font-bold text-[#F43F5E] dark:text-rose-400">
                {genderStats.femalePct}% <span className="text-xs font-normal text-[#64748B] dark:text-[#94A3B8]">{t('dashboard.genderFemale', 'إناث')} ({genderStats.females})</span>
              </span>
            </div>
            {/* Visual Bar */}
            <div className="h-2 w-full bg-[#F1F5F9] dark:bg-[#1E293B] rounded-full mt-2 overflow-hidden flex shadow-inner">
              <div className="bg-[#0878D1] dark:bg-[#38BDF8] h-full transition-all duration-500" style={{ width: `${genderStats.malePct}%` }} title={`${t('dashboard.genderMale', 'ذكور')}: ${genderStats.males}`} />
              <div className="bg-[#F43F5E] dark:bg-rose-500 h-full transition-all duration-500" style={{ width: `${genderStats.femalePct}%` }} title={`${t('dashboard.genderFemale', 'إناث')}: ${genderStats.females}`} />
            </div>
          </CardContent>
        </Card>

        {/* Driver Payouts KPI */}
        <Card hoverable onClick={() => navigate('/driver-payouts')} className="cursor-pointer border-[#FDE68A] dark:border-amber-800/40 bg-gradient-to-br from-[#FFFBEB] via-white to-white dark:from-[#1E293B] dark:via-[#151D2E] dark:to-[#151D2E]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#92400E] dark:text-amber-300 uppercase tracking-wider truncate">
                {t('dashboard.kpiDriverPayouts', 'قبض السواقين')}
              </span>
              <div className="p-2 rounded-xl bg-[#FEF3C7] dark:bg-amber-950/50 text-[#D97706] dark:text-amber-400">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-lg font-black text-[#78350F] dark:text-amber-200 truncate">
                {driverWeeklyTotal ? `${driverWeeklyTotal.toLocaleString()} ${t('dashboard.egpAbbr', 'ج')}` : `0 ${t('dashboard.egpAbbr', 'ج')}`}
              </span>
              <Badge variant="warning">
                {t('dashboard.driverCountSuffix', '{{count}} سائق', { count: driverCount })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Missing Documents */}
        <Card hoverable onClick={() => navigate('/documents')} className="cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider truncate">
                {t('dashboard.kpiMissingDocs', 'نواقص المستندات')}
              </span>
              <div className="p-2 rounded-xl bg-[#FFF1F2] dark:bg-rose-950/40 text-[#E11D48] dark:text-rose-400">
                <FileWarning className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#172033] dark:text-[#F8FAFC]">{missingDocsCount}</span>
              <Badge variant={missingDocsCount > 0 ? 'danger' : 'success'}>
                {missingDocsCount > 0 ? t('dashboard.actionRequired', 'مطلوب') : t('common.completed', 'مكتمل')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS SECTION 1: WORKFORCE & STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Headcount by Department */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-4 px-5">
            <CardTitle className="text-sm font-bold text-[#172033] dark:text-[#F8FAFC]">
              {t('dashboard.headcountByDept', 'توزيع القوى العاملة حسب الأقسام')}
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {t('dashboard.headcountDesc', 'توزيع الموظفين الفعلي على الأقسام المعتمدة')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {headcountByDeptData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#94A3B8] dark:text-[#64748B]">
                {t('dashboard.noDeptData', 'لا توجد بيانات أقسام مسجلة حتى الآن')}
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={headcountByDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridStroke} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: chartAxisFill }}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: chartAxisFill }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value: any, _: any, item: any) => [
                        `${value} ${t('common.staff', 'موظف')}`,
                        item.payload.fullName || item.payload.name,
                      ]}
                    />
                    <Bar dataKey="count" fill="#0878D1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="py-4 px-5">
            <CardTitle className="text-sm font-bold text-[#172033] dark:text-[#F8FAFC]">
              {t('dashboard.statusDistribution', 'توزيع الحالات الوظيفية')}
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {t('dashboard.statusDesc', 'نسبة الموظفين حسب الحالة')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            {totalEmployees === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-[#94A3B8] dark:text-[#64748B]">
                {t('dashboard.noEmpData', 'لا توجد بيانات موظفين مسجلة')}
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
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 text-[11px] mt-2">
                  {statusDistData.map(item => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CHARTS SECTION 2: DRIVER FLEET TREND & SENIORITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver Fleet Payouts Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-4 px-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#172033] dark:text-[#F8FAFC] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#D97706] dark:text-[#FBBF24]" />
                <span>{t('dashboard.driverPayoutsTrend', 'التحليل المالي لحركات ونقل السائقين')}</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {t('dashboard.driverPayoutsTrendDesc', 'مقارنة تكاليف النقل الأسبوعية (الإدارة مقابل الإنتاج)')}
              </CardDescription>
            </div>
            <button
              onClick={() => navigate('/driver-payouts')}
              className="text-xs text-[#0878D1] hover:text-[#0667B2] dark:text-[#38BDF8] dark:hover:text-[#60A5FA] font-semibold flex items-center cursor-pointer transition-colors"
            >
              {t('dashboard.openMatrix', 'فتح المصفوفة')} <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 rtl:ml-0.5" />
            </button>
          </CardHeader>
          <CardContent className="p-4">
            {driverTrendData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#94A3B8] dark:text-[#64748B]">
                {t('dashboard.noWeeklyData', 'لا توجد بيانات أسبوعية مسجلة حالياً')}
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driverTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridStroke} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: chartAxisFill }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: chartAxisFill }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={val => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(val: any, name: any) => [
                        `${Number(val).toLocaleString()} ${t('dashboard.egpAbbr', 'ج')}`,
                        name === 'production' ? t('dashboard.colProduction', 'إنتاج') : t('dashboard.colManagement', 'إدارة'),
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                      formatter={val => (val === 'production' ? t('dashboard.colProduction', 'منصرف الإنتاج') : t('dashboard.colManagement', 'منصرف الإدارة'))}
                    />
                    <Bar dataKey="production" name="production" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={35} />
                    <Bar dataKey="management" name="management" fill="#0878D1" radius={[6, 6, 0, 0]} maxBarSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tenure & Seniority Distribution */}
        <Card>
          <CardHeader className="py-4 px-5">
            <CardTitle className="text-sm font-bold text-[#172033] dark:text-[#F8FAFC] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0878D1] dark:text-[#38BDF8]" />
              <span>{t('dashboard.tenureDistribution', 'توزيع الأقدمية وسنوات الخبرة')}</span>
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {t('dashboard.tenureDesc', 'توزيع العاملين بالمنشأة حسب فترات البقاء في العمل')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenureData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridStroke} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: chartAxisFill }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="range" tick={{ fontSize: 11, fill: chartAxisFill }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(val: any, _: any, item: any) => [
                      `${val} ${t('common.staff', 'موظف')} (${Math.round((Number(val) / (totalEmployees || 1)) * 100)}%)`,
                      item.payload.label,
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={25}>
                    {tenureData.map((entry, index) => (
                      <Cell key={`tenure-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B] text-[11px]">
              {tenureData.map(item => (
                <div key={item.range} className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8]">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="font-bold text-[#172033] dark:text-[#F8FAFC]">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OPERATIONAL WIDGETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Widget 1: Upcoming Celebrations */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-gradient-to-r from-rose-50/50 to-amber-50/50 dark:from-rose-950/20 dark:to-amber-950/20">
            <CardTitle className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC] flex items-center gap-1.5">
              <Cake className="w-4 h-4 text-rose-500" />
              <span>{t('dashboard.upcomingCelebrations', 'شريط المناسبات والذكرى')}</span>
            </CardTitle>
            <CardDescription className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
              {t('dashboard.celebrationsDesc', 'خلال الـ 30 يوماً القادمة')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            {upcomingCelebrations.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#94A3B8] dark:text-[#64748B]">
                {t('dashboard.noCelebrations', 'لا توجد مناسبات قادمة خلال الـ 30 يوماً القادمة')}
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingCelebrations.map(item => (
                  <div key={item.id} className="p-2 rounded-xl bg-[#F8FAFC] dark:bg-[#0B0F19] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${item.type === 'birthday' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
                        {item.type === 'birthday' ? <Cake className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC] block truncate">
                          {item.employeeName}
                        </span>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block truncate">
                          {item.type === 'anniversary' && item.years
                            ? t('dashboard.completedYears', { years: item.years })
                            : item.department}
                        </span>
                      </div>
                    </div>
                    <Badge variant={item.daysUntil === 0 ? 'danger' : item.daysUntil <= 3 ? 'warning' : 'secondary'}>
                      {item.daysUntil === 0
                        ? t('dashboard.today', 'اليوم')
                        : item.daysUntil === 1
                        ? t('dashboard.tomorrow', 'غداً')
                        : t('dashboard.inDays', { days: item.daysUntil })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 2: Driver Payouts Quick Matrix */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#D97706] dark:text-[#FBBF24]" />
                <span>{t('dashboard.driverPayoutSheet', 'شيت قبض السواقين')}</span>
              </CardTitle>
              <button
                onClick={() => navigate('/driver-payouts')}
                className="text-xs text-[#0878D1] hover:text-[#0667B2] dark:text-[#38BDF8] dark:hover:text-[#60A5FA] font-semibold flex items-center cursor-pointer transition-colors"
              >
                {t('dashboard.openMatrix', 'فتح')} <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 rtl:ml-0.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {driverSummary ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">{t('dashboard.weekPeriodLabel', 'فترة الأسبوع:')}</span>
                  <span className="font-bold text-[#172033] dark:text-[#F8FAFC] text-[11px] truncate max-w-[120px]">{driverSummary.weekLabel || driverSummary.weekPeriod}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">{t('dashboard.totalDisbursedLabel', 'المنصرف:')}</span>
                  <span className="font-black text-[#059669] dark:text-[#34D399] text-sm">
                    {driverSummary.totalAmount?.toLocaleString()} {t('common.egp', 'ج')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">{t('dashboard.participatingDriversLabel', 'عدد السائقين:')}</span>
                  <Badge variant="warning">
                    {t('dashboard.driverCountSuffix', '{{count}} سائق', { count: driverSummary.totalDrivers })}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B]">
                  <span className="text-[#E11D48] dark:text-[#FB7185] font-semibold">
                    {t('dashboard.managementShort', 'إدارة')}: {driverSummary.managementTotal?.toLocaleString()} {t('dashboard.egpAbbr', 'ج')}
                  </span>
                  <span className="text-[#172033] dark:text-[#F8FAFC] font-semibold">
                    {t('dashboard.productionShort', 'إنتاج')}: {driverSummary.productionTotal?.toLocaleString()} {t('dashboard.egpAbbr', 'ج')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#94A3B8] dark:text-[#64748B]">
                {t('dashboard.noWeeklyData', 'لا توجد بيانات أسبوعية مسجلة حالياً')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 3: Missing Documents Attention */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC]">
                {t('dashboard.missingDocsWidget', 'نواقص أوراق التعيين')}
              </CardTitle>
              <button
                onClick={() => navigate('/documents')}
                className="text-xs text-[#0878D1] hover:text-[#0667B2] dark:text-[#38BDF8] dark:hover:text-[#60A5FA] font-semibold flex items-center cursor-pointer transition-colors"
              >
                {t('dashboard.reviewFiles', 'مراجعة')} <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 rtl:ml-0.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-3 divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
            {missingDocsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#94A3B8] dark:text-[#64748B]">
                {t('dashboard.allDocsComplete', 'جميع ملفات الموظفين مكتملة')}
              </div>
            ) : (
              missingDocsList.map(emp => (
                <div key={emp.id} className="py-2 px-1 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] truncate">
                      {getLocalizedEmpName(emp)}
                    </span>
                    <Badge variant="danger">{emp.missingDocumentsCount} {t('dashboard.missingSuffix', 'نواقص')}</Badge>
                  </div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 flex items-center justify-between">
                    <span className="truncate">{getLocalizedDeptName(emp.departmentId, emp.departmentName)}</span>
                    <span>{emp.documentCompletenessPercentage}% {t('dashboard.completedPct', 'مكتمل')}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Widget 4: Recent HR Activity Log */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC]">
                {t('dashboard.recentActivity', 'سجل العمليات الأخير')}
              </CardTitle>
              <button
                onClick={() => navigate('/audit-logs')}
                className="text-xs text-[#0878D1] hover:text-[#0667B2] dark:text-[#38BDF8] dark:hover:text-[#60A5FA] font-semibold flex items-center cursor-pointer transition-colors"
              >
                {t('common.viewAll', 'عرض')} <ChevronRight className="w-3.5 h-3.5 mr-0.5 rtl:ml-0.5 rtl:rotate-180" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#94A3B8] dark:text-[#64748B]">
                {t('dashboard.noActivityLogs', 'لا توجد سجلات نشاط مسجلة')}
              </div>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map(log => (
                  <div key={log.id} className="text-xs border-l-2 border-[#0878D1] dark:border-[#38BDF8] pl-2.5 rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-2.5 py-0.5">
                    <div className="font-semibold text-[#172033] dark:text-[#F8FAFC] text-[11px] truncate">{log.action}</div>
                    <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">{log.target}</div>
                    <div className="text-[9px] text-[#94A3B8] dark:text-[#64748B] mt-0.5">
                      {log.userName} • {log.timestamp.split(' ')[1] || log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ADD EMPLOYEE MODAL (Triggered from Quick Actions) */}
      <EmployeeFormModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSubmit={handleCreateEmployee}
      />
    </div>
  );
};
