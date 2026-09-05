import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/features/auth/authStore';

// Lazy-loaded routes for code-splitting
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));

// Employees
const EmployeeListPage = lazy(() => import('@/features/employees/EmployeeListPage'));
const EmployeeKanbanPage = lazy(() => import('@/features/employees/EmployeeKanbanPage'));
const EmployeeFormPage = lazy(() => import('@/features/employees/EmployeeFormPage'));
const EmployeeDetailPage = lazy(() => import('@/features/employees/EmployeeDetailPage'));
const SelfServiceProfilePage = lazy(() => import('@/features/employees/SelfServiceProfilePage'));

// Departments & Positions
const DepartmentsPage = lazy(() => import('@/features/departments/DepartmentsPage'));

// Contracts
const ContractsPage = lazy(() => import('@/features/contracts/ContractsPage'));

// Attendance (Admin/HR)
const AttendancePage = lazy(() => import('@/features/attendance/AttendancePage'));

// Time Off (Admin/HR)
const TimeOffPage = lazy(() => import('@/features/timeOff/TimeOffPage'));

// Payroll & Payruns
const PayrollPage = lazy(() => import('@/features/payroll/PayrollPage'));
const PayrunDetailPage = lazy(() => import('@/features/payroll/PayrunDetailPage'));

// Employee Self-Service
const MyAttendancePage = lazy(() => import('@/features/selfService/MyAttendancePage'));
const MyTimeOffPage = lazy(() => import('@/features/selfService/MyTimeOffPage'));
const MyPayslipsPage = lazy(() => import('@/features/selfService/MyPayslipsPage'));

// Role definitions
const HR_ROLES = ['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const PAYROLL_ROLES = ['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];

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

            {/* Self-Service Routes (accessible to all authenticated users) */}
            <Route path="/profile" element={<SelfServiceProfilePage />} />
            <Route path="/my-attendance" element={<MyAttendancePage />} />
            <Route path="/my-time-off" element={<MyTimeOffPage />} />
            <Route path="/my-payslips" element={<MyPayslipsPage />} />

            {/* HR / Admin Employee Directory Routes */}
            <Route element={<ProtectedRoute allowedRoles={HR_ROLES} />}>
              <Route path="/employees" element={<EmployeeListPage />} />
              <Route path="/employees/kanban" element={<EmployeeKanbanPage />} />
              <Route path="/employees/new" element={<EmployeeFormPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/time-off" element={<TimeOffPage />} />
            </Route>

            {/* Payroll Routes */}
            <Route element={<ProtectedRoute allowedRoles={PAYROLL_ROLES} />}>
              <Route path="/payroll" element={<PayrollPage />} />
              <Route path="/payroll/payruns/:id" element={<PayrunDetailPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
