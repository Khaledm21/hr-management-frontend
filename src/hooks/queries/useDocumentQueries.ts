import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService, DocumentFilterParams } from '../../services/documentService';
import { insuranceKeys } from './useInsuranceQueries';
import { employeeKeys } from './useEmployeeQueries';

export const documentKeys = {
  all: ['documents'] as const,
  list: (params?: DocumentFilterParams) => [...documentKeys.all, 'list', params] as const,
};

/**
 * Fetch documents with caching
 */
export const useDocuments = (params: DocumentFilterParams = {}) => {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentService.getDocuments(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Verify document mutation
 */
export const useVerifyDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      documentService.verifyDocument(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

/**
 * Reject document mutation
 */
export const useRejectDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      documentService.rejectDocument(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

/**
 * Delete single document mutation
 */
export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

/**
 * Bulk delete documents mutation
 */
export const useBulkDeleteDocumentsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => documentService.bulkDeleteDocuments(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

/**
 * Delete all documents mutation
 */
export const useDeleteAllDocumentsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => documentService.deleteAllDocuments(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

/**
 * Upload document mutation
 */
export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof documentService.uploadDocument>[0]) =>
      documentService.uploadDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

