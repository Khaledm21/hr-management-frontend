import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardStats } from '../../services/dashboardService';
import { auditService } from '../../services/auditService';
import { attendanceService } from '../../services/attendanceService';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  attendanceStats: () => [...dashboardKeys.all, 'attendanceStats'] as const,
  auditLogs: (module?: string, search?: string) =>
    [...dashboardKeys.all, 'auditLogs', module, search] as const,
};

/**
 * Fetch unified dashboard stats with 3-minute caching
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getDashboardStats(),
    staleTime: 3 * 60 * 1000,
  });
};

/**
 * Fetch live attendance statistics
 */
export const useAttendanceStats = () => {
  return useQuery({
    queryKey: dashboardKeys.attendanceStats(),
    queryFn: () => attendanceService.getAttendanceStats(),
    staleTime: 60 * 1000,
  });
};

/**
 * Fetch audit logs with 3-minute caching
 */
export const useAuditLogs = (module?: string, search?: string) => {
  return useQuery({
    queryKey: dashboardKeys.auditLogs(module, search),
    queryFn: () => auditService.getAuditLogs(module, search),
    staleTime: 3 * 60 * 1000,
  });
};
