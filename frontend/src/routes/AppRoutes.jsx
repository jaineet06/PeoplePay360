import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/features/auth/authStore';

// Lazy-loaded routes for code-splitting
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const EmployeeListPage = lazy(() => import('@/features/employees/EmployeeListPage'));
const EmployeeKanbanPage = lazy(() => import('@/features/employees/EmployeeKanbanPage'));
const EmployeeFormPage = lazy(() => import('@/features/employees/EmployeeFormPage'));
const EmployeeDetailPage = lazy(() => import('@/features/employees/EmployeeDetailPage'));
const SelfServiceProfilePage = lazy(() => import('@/features/employees/SelfServiceProfilePage'));
const PlaceholderModulePage = lazy(() => import('@/components/common/PlaceholderModulePage'));

// HR roles allowed to manage employees
const HR_ROLES = ['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];

export function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Application Routes inside AppShell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            {/* Default root redirects based on role */}
            <Route
              path="/"
              element={
                <Navigate
                  to={user?.role === 'EMPLOYEE' ? '/profile' : '/employees'}
                  replace
                />
              }
            />

            {/* Self-Service Profile Route (accessible to all authenticated, primary landing for EMPLOYEE) */}
            <Route path="/profile" element={<SelfServiceProfilePage />} />

            {/* HR / Admin Protected Employee Module Routes */}
            <Route element={<ProtectedRoute allowedRoles={HR_ROLES} />}>
              <Route path="/employees" element={<EmployeeListPage />} />
              <Route path="/employees/kanban" element={<EmployeeKanbanPage />} />
              <Route path="/employees/new" element={<EmployeeFormPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
            </Route>

            {/* Placeholder Routes for Subsequent Phases */}
            <Route
              path="/departments"
              element={
                <PlaceholderModulePage
                  moduleName="Departments"
                  phaseDescription="Department organization, budget lines, and hierarchy management."
                />
              }
            />
            <Route
              path="/contracts"
              element={
                <PlaceholderModulePage
                  moduleName="Contracts"
                  phaseDescription="Contract agreements, salary structure binding, and wage history."
                />
              }
            />
            <Route
              path="/attendance"
              element={
                <PlaceholderModulePage
                  moduleName="Attendance"
                  phaseDescription="Daily clock-in/out tracking, biometric sync, and hours calculation."
                />
              }
            />
            <Route
              path="/time-off"
              element={
                <PlaceholderModulePage
                  moduleName="Time Off"
                  phaseDescription="Leave quotas, time-off requests approval workflow, and balance deductions."
                />
              }
            />
            <Route
              path="/payroll"
              element={
                <PlaceholderModulePage
                  moduleName="Payroll & Payslips"
                  phaseDescription="Two-step payrun execution wizard, payslip computations, and PDF export."
                />
              }
            />
          </Route>
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
