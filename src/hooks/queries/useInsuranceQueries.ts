import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  insuranceService,
  SocialInsuranceFilterParams,
  MissingDocumentsFilterParams,
} from '../../services/insuranceService';
import { SocialInsuranceRecord, MissingDocumentRecord } from '../../types';

export const insuranceKeys = {
  all: ['insurance'] as const,
  social: (params?: SocialInsuranceFilterParams) => [...insuranceKeys.all, 'social', params] as const,
  missingDocs: (params?: MissingDocumentsFilterParams) => [...insuranceKeys.all, 'missingDocs', params] as const,
  stats: () => [...insuranceKeys.all, 'stats'] as const,
};

/**
 * Fetch Social Insurance Records with automatic deduplication and caching
 */
export const useSocialInsurance = (params: SocialInsuranceFilterParams = {}) => {
  return useQuery({
    queryKey: insuranceKeys.social(params),
    queryFn: () => insuranceService.getSocialInsuranceRecords(params),
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
  });
};

/**
 * Fetch Missing Documents Checklist with caching
 */
export const useMissingDocuments = (params: MissingDocumentsFilterParams = {}) => {
  return useQuery({
    queryKey: insuranceKeys.missingDocs(params),
    queryFn: () => insuranceService.getMissingDocumentsRecords(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch Insurance & Reconciliation KPI Stats
 */
export const useInsuranceStats = () => {
  return useQuery({
    queryKey: insuranceKeys.stats(),
    queryFn: () => insuranceService.getInsuranceStats(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Mutation to toggle a missing/available document with automatic cache invalidation
 */
export const useToggleDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      docType,
    }: {
      id: string;
      docType: 'qualificationCert' | 'birthCert' | 'idCard' | 'contract';
    }) => insuranceService.toggleDocumentStatus(id, docType),
    onSuccess: (updatedRecord) => {
      // Optimistically update or invalidate missing documents queries
      queryClient.invalidateQueries({ queryKey: [...insuranceKeys.all, 'missingDocs'] });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

/**
 * Mutation to import social insurance records
 */
export const useImportSocialInsuranceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      records,
      overwrite,
    }: {
      records: Partial<SocialInsuranceRecord>[];
      overwrite?: boolean;
    }) => insuranceService.importSocialInsurance(records, overwrite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...insuranceKeys.all, 'social'] });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

/**
 * Mutation to import missing documents records
 */
export const useImportMissingDocumentsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      records,
      overwrite,
    }: {
      records: Partial<MissingDocumentRecord>[];
      overwrite?: boolean;
    }) => insuranceService.importMissingDocuments(records, overwrite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...insuranceKeys.all, 'missingDocs'] });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};
