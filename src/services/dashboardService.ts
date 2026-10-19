import { apiClient } from './apiClient';
import { employeeService } from './employeeService';
import { departmentService } from './departmentService';
import { driverPayoutService } from './driverPayoutService';

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  newEmployeesThisMonth: number;
  onLeaveEmployees: number;
  missingDocsCount: number;
  expiringContractsCount: number;
  pendingApprovalsCount: number;
  driverWeeklyTotal: number;
  driverCount: number;
  headcountByDept: Array<{
    id: string;
    code: string;
    name: string;
    nameAr: string;
    nameZh?: string;
    count: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
  recentEmployees?: any[];
}

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    // 1. Attempt to fetch unified dashboard stats from backend
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/dashboard/stats');
        const data = res?.data || res;
        if (data && typeof data.totalEmployees === 'number') {
          return data;
        }
      } catch (err) {
        console.warn('Backend /dashboard/stats unavailable, aggregating from live services:', err);
      }
    }

    // 2. Client-side aggregation strictly from live data (Zero mock data fallback)
    const [employeesRes, departments, driverSummaries] = await Promise.all([
      employeeService.getEmployees({ pageSize: 500 }),
      departmentService.getDepartments(),
      driverPayoutService.getWeeklySummaries(),
    ]);

    const employees = employeesRes.data || [];
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.employmentStatus === 'active').length;
    const newEmployeesThisMonth = employees.filter(e => e.hireDate && e.hireDate.startsWith(currentMonthPrefix)).length;
    const onLeaveEmployees = employees.filter(e => e.employmentStatus === 'on_leave').length;
    const missingDocsCount = employees.filter(e => (e.missingDocumentsCount || 0) > 0).length;

    // Latest driver payouts stats
    const latestWeekSummary = driverSummaries[0] || null;
    const driverWeeklyTotal = latestWeekSummary?.totalAmount || 0;
    const driverCount = latestWeekSummary?.totalDrivers || 0;

    // Headcount by Department
    const headcountByDept = departments.map(d => ({
      id: d.id,
      code: d.code,
      name: d.name,
      nameAr: d.nameAr || d.name,
      nameZh: d.nameZh || d.name,
      count: employees.filter(e => e.departmentId === d.id || e.departmentName === d.name).length,
    }));

    // Status Distribution
    const statuses = ['active', 'probation', 'on_leave', 'suspended', 'terminated'];
    const statusDistribution = statuses.map(s => ({
      status: s,
      count: employees.filter(e => e.employmentStatus === s).length,
    }));

    const recentEmployees = [...employees]
      .sort((a, b) => new Date(b.hireDate || '').getTime() - new Date(a.hireDate || '').getTime())
      .slice(0, 5);

    return {
      totalEmployees,
      activeEmployees,
      newEmployeesThisMonth,
      onLeaveEmployees,
      missingDocsCount,
      expiringContractsCount: 0,
      pendingApprovalsCount: 0,
      driverWeeklyTotal,
      driverCount,
      headcountByDept,
      statusDistribution,
      recentEmployees,
    };
  },
};
