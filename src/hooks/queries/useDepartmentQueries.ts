import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../../services/departmentService';
import { Department } from '../../types';

export const departmentKeys = {
  all: ['departments'] as const,
  list: () => [...departmentKeys.all, 'list'] as const,
  positions: (deptId?: string) => [...departmentKeys.all, 'positions', deptId] as const,
};

/**
 * Fetch all departments (rarely changes, highly cached for 10 minutes)
 */
export const useDepartments = () => {
  return useQuery({
    queryKey: departmentKeys.list(),
    queryFn: () => departmentService.getDepartments(),
    staleTime: 10 * 60 * 1000,
  });
};

import { positionService } from '../../services/positionService';
import { positionKeys } from './usePositionQueries';

/**
 * Fetch positions with caching, fully unified with positions module
 */
export const usePositions = (departmentId?: string) => {
  return useQuery({
    queryKey: positionKeys.list(departmentId && departmentId !== 'all' ? { departmentId } : {}),
    queryFn: () => positionService.getPositions(departmentId && departmentId !== 'all' ? { departmentId } : {}),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create Department Mutation
 */
export const useCreateDepartmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newDept: Partial<Department>) => departmentService.createDepartment(newDept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
};

/**
 * Update Department Mutation
 */
export const useUpdateDepartmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
      departmentService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
};

/**
 * Delete Department Mutation
 */
export const useDeleteDepartmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => departmentService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
};

