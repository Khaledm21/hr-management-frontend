import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverPayoutService } from '../../services/driverPayoutService';
import { Driver, DriverPayoutTransaction } from '../../types/driverPayouts';

export const driverKeys = {
  all: ['driver-payouts'] as const,
  matrix: (weekPeriod: string) => [...driverKeys.all, 'matrix', weekPeriod] as const,
  drivers: () => [...driverKeys.all, 'drivers'] as const,
  summaries: () => [...driverKeys.all, 'summaries'] as const,
  transactions: (params?: any) => [...driverKeys.all, 'transactions', params] as const,
};

/**
 * Fetch weekly matrix for a given week with 5-minute caching
 */
export const useDriverMatrix = (weekPeriod: string) => {
  return useQuery({
    queryKey: driverKeys.matrix(weekPeriod),
    queryFn: () => driverPayoutService.getWeeklyColumns(weekPeriod),
    enabled: Boolean(weekPeriod),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch all registered drivers with caching
 */
export const useDrivers = () => {
  return useQuery({
    queryKey: driverKeys.drivers(),
    queryFn: () => driverPayoutService.getDrivers(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch all weekly payout summaries with caching
 */
export const useWeeklySummaries = () => {
  return useQuery({
    queryKey: driverKeys.summaries(),
    queryFn: () => driverPayoutService.getWeeklySummaries(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Mutations for driver payout actions with automatic cache invalidation
 */
export const useCreateDriverMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof driverPayoutService.createDriver>[0]) =>
      driverPayoutService.createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
    },
  });
};

export const useUpdateDriverMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) =>
      driverPayoutService.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
    },
  });
};

export const useDeleteDriverMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => driverPayoutService.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
    },
  });
};

export const useCreatePayoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof driverPayoutService.createTransaction>[0]) =>
      driverPayoutService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
    },
  });
};

export const useUpdatePayoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DriverPayoutTransaction> }) =>
      driverPayoutService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
    },
  });
};

export const useDeletePayoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => driverPayoutService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
    },
  });
};

export const useCreateWeekMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, label }: { date: string; label: string }) =>
      driverPayoutService.createNewWeeklyCycle(date, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
    },
  });
};
