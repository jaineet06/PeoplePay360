import React, { useState } from 'react';
import { Edit2, ShieldAlert, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';
import { usePagination } from '@/hooks/usePagination';
import { useAttendanceList } from '../hooks/useAttendance';
import { AttendanceCorrectionModal } from './AttendanceCorrectionModal';
import { useAuthStore } from '@/features/auth/authStore';

export function AttendanceTable({
  employeeId = null,
  readOnly = false,
  dateFrom = '',
  dateTo = '',
  status = '',
  hideEmployeeColumn = false,
}) {
  const { page, limit, onPageChange, onLimitChange } = usePagination(1, 10);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const user = useAuthStore((state) => state.user);
  const isHr = ['HR_MANAGER', 'ADMIN'].includes(user?.role);
  const canCorrect = !readOnly && isHr;

  const { data, isLoading } = useAttendanceList({
    page,
    limit,
    employeeId: employeeId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    status: status || undefined,
    sortBy: 'date',
    order: 'desc',
  });

  const handleOpenCorrection = (record) => {
    setSelectedRecord(record);
    setCorrectionModalOpen(true);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (date, row) => (
        <div>
          <div className="font-semibold text-slate-900">{formatDate(date)}</div>
          {row.isManualCorrection && (
            <div className="inline-flex items-center text-[10px] text-amber-600 font-medium mt-0.5">
              <ShieldAlert className="h-3 w-3 mr-1" />
              Adjusted {row.correctedBy?.email ? `by ${row.correctedBy.email}` : ''}
            </div>
          )}
        </div>
      ),
    },
    ...(!hideEmployeeColumn && !employeeId
      ? [
          {
            key: 'employee',
            header: 'Employee',
            render: (_, row) => (
              <div>
                <div className="font-semibold text-slate-900">{row.employee?.fullName || '—'}</div>
                <div className="font-mono text-[11px] text-slate-400">{row.employee?.employeeCode}</div>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'checkIn',
      header: 'Check-In',
      render: (checkIn) => (
        <span className="font-mono text-slate-700 font-medium">
          {formatTime(checkIn)}
        </span>
      ),
    },
    {
      key: 'checkOut',
      header: 'Check-Out',
      render: (checkOut) => (
        <span className="font-mono text-slate-700 font-medium">
          {formatTime(checkOut)}
        </span>
      ),
    },
    {
      key: 'workedHours',
      header: 'Worked Hours',
      render: (workedHours) => (
        <span className="font-semibold text-slate-800">
          {workedHours !== null && workedHours !== undefined
            ? `${Number(workedHours).toFixed(2)} hrs`
            : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (st, row) => (
        <div className="space-y-1">
          <StatusPill status={st} size="xs" />
          {row.correctionReason && (
            <div className="text-[10px] text-slate-400 italic max-w-xs truncate" title={row.correctionReason}>
              Reason: {row.correctionReason}
            </div>
          )}
        </div>
      ),
    },
    ...(canCorrect
      ? [
          {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (_, row) => (
              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={Edit2}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCorrection(row);
                  }}
                >
                  Correct
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        emptyTitle="No attendance records found"
        emptyDescription="No check-in or check-out activity logged for this time period."
      />

      {canCorrect && (
        <AttendanceCorrectionModal
          isOpen={correctionModalOpen}
          onClose={() => {
            setCorrectionModalOpen(false);
            setSelectedRecord(null);
          }}
          attendance={selectedRecord}
        />
      )}
    </div>
  );
}
