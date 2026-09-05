import React, { useState, useEffect } from 'react';
import { CalendarCheck2, LogIn, LogOut, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AttendanceTable } from '@/features/attendance/components/AttendanceTable';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/features/auth/authStore';
import { useAttendanceList, useCheckIn, useCheckOut } from '@/features/attendance/hooks/useAttendance';
import { toast } from '@/components/ui/Toast';

export function MyAttendancePage() {
  const user = useAuthStore((state) => state.user);
  const isLinkedToEmployee = Boolean(user?.employeeId);

  // Today's date string YYYY-MM-DD for querying today's status
  const todayIso = new Date().toISOString().split('T')[0];

  const { data: todayData, isLoading: isLoadingToday } = useAttendanceList({
    dateFrom: todayIso,
    dateTo: todayIso,
    limit: 1,
  });

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const todayRecord = todayData?.data?.[0];
  const hasClockedIn = Boolean(todayRecord?.checkIn);
  const hasClockedOut = Boolean(todayRecord?.checkOut);
  const isShiftActive = hasClockedIn && !hasClockedOut;

  // Live time ticker
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleClockIn = async () => {
    if (!isLinkedToEmployee) {
      toast.error('Your login is not linked to an employee profile.');
      return;
    }
    if (hasClockedIn) {
      toast.error('You have already clocked in for today.');
      return;
    }
    try {
      await checkInMutation.mutateAsync({ source: 'WEB' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    if (!isLinkedToEmployee) {
      toast.error('Your login is not linked to an employee profile.');
      return;
    }
    if (!hasClockedIn) {
      toast.error('You must clock in before clocking out.');
      return;
    }
    if (hasClockedOut) {
      toast.error('You have already clocked out for today.');
      return;
    }
    try {
      await checkOutMutation.mutateAsync({ source: 'WEB' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clock out');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
          <CalendarCheck2 className="h-6 w-6 text-brand-600" />
          My Attendance Record
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Personal work hours, punch history, and daily attendance records
        </p>
      </div>

      {/* Account not linked warning banner */}
      {!isLinkedToEmployee && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-semibold">No Employee Profile Linked: </span>
            Your account ({user?.email}) is configured with an administrative role without a personal employee profile. Attendance punching is recorded on employee profiles.
          </div>
        </div>
      )}

      {/* Live Punch & Today's Shift Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Current Time & Date */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Today's Shift &bull; {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>

            {/* Current punch status summary */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              {hasClockedOut ? (
                <div className="flex items-center text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                  <span>
                    Shift completed &bull; In: {formatTime(todayRecord.checkIn)} &bull; Out: {formatTime(todayRecord.checkOut)} ({Number(todayRecord.workedHours).toFixed(1)} hrs)
                  </span>
                </div>
              ) : isShiftActive ? (
                <div className="flex items-center text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                  <Clock className="h-4 w-4 mr-1.5 text-brand-600 animate-pulse" />
                  <span>
                    Clocked in at {formatTime(todayRecord.checkIn)} &bull; Shift currently in progress
                  </span>
                </div>
              ) : (
                <div className="text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Not clocked in yet today
                </div>
              )}

              {todayRecord?.status && (
                <StatusPill status={todayRecord.status} size="xs" />
              )}
            </div>
          </div>

          {/* Right: Clock In / Out Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              size="md"
              className={
                hasClockedIn
                  ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200 border-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }
              leftIcon={LogIn}
              isLoading={checkInMutation.isPending}
              disabled={hasClockedIn || !isLinkedToEmployee || isLoadingToday}
              onClick={handleClockIn}
            >
              {hasClockedIn ? 'Clocked In' : 'Clock In'}
            </Button>

            <Button
              variant="outline"
              size="md"
              className={
                !isShiftActive
                  ? 'opacity-50 cursor-not-allowed text-slate-400 border-slate-200'
                  : 'border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400'
              }
              leftIcon={LogOut}
              isLoading={checkOutMutation.isPending}
              disabled={!isShiftActive || !isLinkedToEmployee || isLoadingToday}
              onClick={handleClockOut}
            >
              {hasClockedOut ? 'Clocked Out' : 'Clock Out'}
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance History Table — Server Scoped to logged-in user */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Attendance History
        </h2>
        <AttendanceTable
          readOnly={true}
          hideEmployeeColumn={true}
        />
      </div>
    </div>
  );
}

export default MyAttendancePage;
