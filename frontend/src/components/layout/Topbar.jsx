import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, User, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { authApi } from '@/api/auth.api';
import { clearQueryCache } from '@/lib/queryClient';
import { toast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { getInitials } from '@/utils/formatters';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { useTheme } from '@/hooks/useTheme';

export function Topbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authApi.logout();
    } catch {
      // Even if server error, clear client session
    } finally {
      clearQueryCache();
      clearAuth();
      toast.success('Signed out successfully.');
      navigate('/login');
      setIsLoggingOut(false);
    }
  };

  // Human friendly page title derived from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/employees/new')) return 'New Employee';
    if (path.includes('/edit')) return 'Edit Employee';
    if (path.startsWith('/employees/kanban')) return 'Employee Directory (Kanban)';
    if (path.startsWith('/employees/')) return 'Employee Profile';
    if (path.startsWith('/employees')) return 'Employee Directory';
    if (path.startsWith('/profile')) return 'My Profile';
    if (path.startsWith('/departments')) return 'Departments';
    if (path.startsWith('/contracts')) return 'Contracts';
    if (path.startsWith('/attendance')) return 'Attendance';
    if (path.startsWith('/time-off')) return 'Time Off Management';
    if (path.startsWith('/payroll')) return 'Payroll & Payslips';
    if (path.startsWith('/notifications')) return 'Notifications';
    return 'Dashboard';
  };

  const roleVariant = {
    ADMIN: 'purple',
    HR_PAYROLL_MANAGER: 'brand',
    HR_PAYROLL_USER: 'brand',
    HR_MANAGER: 'emerald',
    EMPLOYEE: 'slate',
  }[user?.role] || 'slate';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-4 sm:px-6 shadow-subtle">
      {/* Left: Mobile hamburger & breadcrumbs / title */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 md:hidden focus:outline-none"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2">
          <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Theme toggle + Notifications + User Profile */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Notification bell */}
        <NotificationBell />

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
              {getInitials(user?.employee?.fullName || user?.email || 'User')}
            </div>

            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-100 max-w-[130px] truncate">
                {user?.employee?.fullName || user?.email?.split('@')[0]}
              </div>
              <div className="text-slate-400 dark:text-slate-400 text-[10px] truncate">
                {user?.email}
              </div>
            </div>

            <Badge variant={roleVariant} size="xs" className="hidden lg:inline-flex">
              {user?.role?.replace(/_/g, ' ')}
            </Badge>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
          </button>

          {/* User Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-dropdown py-1.5 text-xs text-slate-700 dark:text-slate-300 z-50 animate-in fade-in-50 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.employee?.fullName || 'Signed In'}
                </div>
                <div className="text-slate-400 dark:text-slate-400 text-[11px] truncate">
                  {user?.email}
                </div>
                <div className="mt-1.5">
                  <Badge variant={roleVariant} size="xs">
                    Role: {user?.role}
                  </Badge>
                </div>
              </div>

              {user?.role === 'EMPLOYEE' && (
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="h-4 w-4 mr-2.5 text-slate-400 dark:text-slate-400" />
                  <span>My Profile</span>
                </button>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center px-4 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2.5" />
                <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
