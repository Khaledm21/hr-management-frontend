import { QueryClient } from '@tanstack/react-query';

/**
 * Enterprise Query Client Configuration
 * Optimized to minimize redundant network requests and cache data efficiently.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes, preventing refetch on tab switch or re-render
      staleTime: 5 * 60 * 1000,
      // Garbage collection time: cache is kept in memory for 15 minutes
      gcTime: 15 * 60 * 1000,
      // Do not refetch automatically on window focus to avoid unnecessary calls
      refetchOnWindowFocus: false,
      // Do not refetch on mount if data is already cached and not stale
      refetchOnMount: false,
      // Retry once on failure
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
