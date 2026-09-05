import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { authApi } from '@/api/auth.api';
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
  const { setAuth, clearAuth, setBooting } = useAuthStore();

  // App boot: silent refresh to persist session across browser reloads
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const response = await authApi.refresh();
        const { user, accessToken } = response.data;
        if (isMounted) {
          setAuth(user, accessToken);
        }
      } catch {
        if (isMounted) {
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
  }, [setAuth, clearAuth, setBooting]);

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
