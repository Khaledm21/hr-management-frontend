import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  employeeService,
  EmployeeFilterParams,
} from '../../services/employeeService';
import { Employee } from '../../types';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (params?: EmployeeFilterParams) => [...employeeKeys.all, 'list', params] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
  stats: () => [...employeeKeys.all, 'stats'] as const,
};

/**
 * Fetch paginated & filtered employees with automatic caching
 */
export const useEmployees = (params: EmployeeFilterParams = {}) => {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeeService.getEmployees(params),
    staleTime: 30 * 1000, // 30 seconds fresh
  });
};

/**
 * Fetch single employee by ID
 */
export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeeService.getEmployeeById(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch employee department/status statistics
 */
export const useEmployeeStats = () => {
  return useQuery({
    queryKey: employeeKeys.stats(),
    queryFn: () => employeeService.getEmployeeStats(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create Employee Mutation
 */
export const useCreateEmployeeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newEmployee: Omit<Employee, 'id'>) => employeeService.createEmployee(newEmployee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

/**
 * Update Employee Mutation
 */
export const useUpdateEmployeeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      employeeService.updateEmployee(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.setQueryData(employeeKeys.detail(updated.id), updated);
    },
  });
};

/**
 * Deactivate / Delete Employee Mutation
 */
export const useDeleteEmployeeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeService.deactivateEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};
