import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes - data is "fresh" during this time
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Don't refetch automatically on window focus
      refetchOnWindowFocus: false,
      
      // Don't refetch on component mount if we have cached data
      refetchOnMount: false,
      
      // Only retry once on failure to avoid slow repeated requests
      retry: 1,
      
      // Show errors in console during development
      throwOnError: process.env.NODE_ENV === 'development',
    },
    mutations: {
      // Only retry mutations once
      retry: 1,
    },
  },
});

// Prefetch commonly used data
export function prefetchCommonData() {
  // You can add prefetch logic here for data that's needed across pages
}
