import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { hasValidStoredSession, refreshAccessToken } from '@/api/refreshSession';
import { AppRoutes } from '@/routes/AppRoutes';
import { Toaster } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Do not retry on 401, 403, 404, or 422
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404 || status === 422) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

export function App() {
  const { clearAuth, setBooting } = useAuthStore();

  // App boot: silent refresh to persist session across browser reloads
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        if (hasValidStoredSession()) {
          if (isMounted) setBooting(false);
          return;
        }
        await refreshAccessToken();
      } catch (err) {
        // Only clear auth if the server returned an explicit 401 (revoked/expired)
        if (isMounted && err?.response?.status === 401) {
          clearAuth();
        }
      } finally {
        if (isMounted) {
          setBooting(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [clearAuth, setBooting]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
