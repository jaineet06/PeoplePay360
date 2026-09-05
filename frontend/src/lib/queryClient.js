import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404 || status === 422) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

/** Wipe all cached server data — call on logout and before a new login session. */
export function clearQueryCache() {
  queryClient.clear();
}
