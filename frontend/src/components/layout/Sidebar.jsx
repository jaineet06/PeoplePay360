import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarRange,
  FileSpreadsheet,
  CalendarCheck2,
  Clock,
  CircleDollarSign,
  User,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { cn } from '@/utils/cn';

export function Sidebar({ isOpen, onClose }) {
  const user = useAuthStore((state) => state.user);
  const isEmployee = user?.role === 'EMPLOYEE';
  const hasPayrollAccess = ['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'].includes(user?.role);

  const hrNavItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: Users,
      badge: null,
    },
    {
      label: 'Departments',
      path: '/departments',
      icon: Building2,
      badge: null,
    },
    {
      label: 'Working Schedules',
      path: '/schedules',
      icon: CalendarRange,
      badge: null,
    },
    {
      label: 'Contracts',
      path: '/contracts',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: CalendarCheck2,
      badge: null,
    },
    {
      label: 'Time Off',
      path: '/time-off',
      icon: Clock,
      badge: null,
    },
    ...(hasPayrollAccess
      ? [
          {
            label: 'Payroll',
            path: '/payroll',
            icon: CircleDollarSign,
            badge: null,
          },
        ]
      : []),
    {
      label: 'User Management',
      path: '/users',
      icon: ShieldCheck,
      badge: null,
    },
  ];

  const employeeNavItems = [
    {
      label: 'My Profile',
      path: '/profile',
      icon: User,
      badge: null,
    },
    {
      label: 'My Attendance',
      path: '/my-attendance',
      icon: CalendarCheck2,
      badge: null,
    },
    {
      label: 'My Time Off',
      path: '/my-time-off',
      icon: Clock,
      badge: null,
    },
    {
      label: 'My Payslips',
      path: '/my-payslips',
      icon: CircleDollarSign,
      badge: null,
    },
  ];

  const navItems = isEmployee ? employeeNavItems : hrNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-200 transition-transform duration-200 ease-in-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo and Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                PeoplePay360
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {isEmployee ? 'Self-Service Portal' : 'HR & Payroll Ops'}
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4 shrink-0 transition-colors" />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:bg-slate-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* System info banner */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="rounded-lg bg-slate-850/80 p-3 border border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>System Operational</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Logged in as <strong className="text-slate-200">{user?.role?.replace(/_/g, ' ')}</strong>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
