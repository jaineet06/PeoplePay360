import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { PageSkeleton } from '@/components/ui/Skeleton';

export function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const { isAuthenticated, isBooting, user } = useAuthStore();

  // Show route-level skeleton while boot session check is running
  if (isBooting) {
    return <PageSkeleton />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role-gated, verify allowed roles
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasRole = allowedRoles.includes(user.role);
    if (!hasRole) {
      // Role mismatch: if regular EMPLOYEE tries to access HR area, send to self-service profile
      if (user.role === 'EMPLOYEE') {
        return <Navigate to="/profile" replace />;
      }
      // Otherwise default to employees list
      return <Navigate to="/employees" replace />;
    }
  }

  return <Outlet />;
}
