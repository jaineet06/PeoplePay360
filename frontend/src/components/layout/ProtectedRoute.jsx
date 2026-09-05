import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';

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
      return <UnauthorizedPage />;
    }
  }

  return <Outlet />;
}

export default ProtectedRoute;
