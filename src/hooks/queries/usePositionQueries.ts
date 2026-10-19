import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { positionService, PositionFilterParams } from '../../services/positionService';
import { Position } from '../../types';

export const positionKeys = {
  all: ['positions'] as const,
  list: (params?: PositionFilterParams) => [...positionKeys.all, 'list', params] as const,
  detail: (id: string) => [...positionKeys.all, 'detail', id] as const,
};

/**
 * Fetch positions with caching (10 minutes)
 */
export const usePositionsQuery = (params: PositionFilterParams = {}) => {
  return useQuery({
    queryKey: positionKeys.list(params),
    queryFn: () => positionService.getPositions(params),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Create Position Mutation
 */
export const useCreatePositionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Position>) => positionService.createPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
    },
  });
};

/**
 * Update Position Mutation
 */
export const useUpdatePositionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Position> }) =>
      positionService.updatePosition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
    },
  });
};

/**
 * Delete Position Mutation
 */
export const useDeletePositionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => positionService.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
    },
  });
};
