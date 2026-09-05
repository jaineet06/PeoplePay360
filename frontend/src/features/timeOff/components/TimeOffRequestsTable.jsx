import React, { useState } from 'react';
import { Check, X, Ban, AlertCircle, Plus } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate } from '@/utils/formatters';
import { usePagination } from '@/hooks/usePagination';
import {
  useTimeOffRequests,
  useApproveRequest,
  useRefuseRequest,
  useCancelRequest,
} from '../hooks/useTimeOff';
import { RefusalReasonModal } from './RefusalReasonModal';
import { TimeOffRequestModal } from './TimeOffRequestModal';
import { useAuthStore } from '@/features/auth/authStore';
import { toast } from '@/components/ui/Toast';

export function TimeOffRequestsTable({
  employeeId = null,
  timeOffTypeId = '',
  status = '',
  dateFrom = '',
  dateTo = '',
  canCreate = true,
  hideEmployeeColumn = false,
}) {
  const { page, limit, onPageChange, onLimitChange } = usePagination(1, 10);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refusalModalTarget, setRefusalModalTarget] = useState(null); // request record
  const [approvalError, setApprovalError] = useState(null);

  const user = useAuthStore((state) => state.user);
  const isHr = ['HR_MANAGER', 'ADMIN'].includes(user?.role);

  const { data, isLoading } = useTimeOffRequests({
    page,
    limit,
    employeeId: employeeId || undefined,
    timeOffTypeId: timeOffTypeId || undefined,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy: 'startDate',
    order: 'desc',
  });

  const approveMutation = useApproveRequest();
  const refuseMutation = useRefuseRequest();
  const cancelMutation = useCancelRequest();

  const handleApprove = async (row) => {
    setApprovalError(null);
    try {
      await approveMutation.mutateAsync(row.id);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to approve time off request.';
      setApprovalError({ id: row.id, message: msg });
      toast.error(msg);
    }
  };

  const handleRefuseConfirm = async (reason) => {
    if (!refusalModalTarget) return;
    try {
      await refuseMutation.mutateAsync({
        id: refusalModalTarget.id,
        data: { refusalReason: reason },
      });
      setRefusalModalTarget(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to refuse request.';
      toast.error(msg);
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelMutation.mutateAsync(id);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel request.';
      toast.error(msg);
    }
  };

  const columns = [
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
      key: 'timeOffType',
      header: 'Leave Type',
      render: (_, row) => (
        <span className="font-semibold text-slate-800">
          {row.timeOffType?.name || 'Leave'}
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Requested Period',
      render: (_, row) => (
        <div>
          <div className="text-slate-800 font-medium">
            {formatDate(row.startDate)} &rarr; {formatDate(row.endDate)}
          </div>
          <div className="text-[11px] text-slate-500">
            {row.duration} {row.unit?.toLowerCase() || 'days'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (st, row) => (
        <div className="space-y-1">
          <StatusPill status={st} size="xs" />
          {row.refusalReason && (
            <div className="text-[10px] text-rose-600 max-w-xs truncate" title={row.refusalReason}>
              Refused: {row.refusalReason}
            </div>
          )}
          {row.approvedBy && st === 'APPROVED' && (
            <div className="text-[10px] text-emerald-700">
              Approved by {row.approvedBy.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Employee Reason',
      render: (r) => (
        <span className="text-slate-600 max-w-xs truncate block text-[11px]" title={r || ''}>
          {r || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end space-x-1.5">
          {isHr && row.status === 'PENDING' && (
            <>
              <Button
                variant="primary"
                size="xs"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                leftIcon={Check}
                isLoading={approveMutation.isPending && approveMutation.variables === row.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(row);
                }}
              >
                Approve
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="text-rose-600 hover:bg-rose-50"
                leftIcon={X}
                onClick={(e) => {
                  e.stopPropagation();
                  setRefusalModalTarget(row);
                }}
              >
                Refuse
              </Button>
            </>
          )}

          {row.status === 'PENDING' && !isHr && (
            <Button
              variant="ghost"
              size="xs"
              className="text-slate-500 hover:text-rose-600"
              leftIcon={Ban}
              onClick={(e) => {
                e.stopPropagation();
                handleCancel(row.id);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button variant="primary" size="xs" leftIcon={Plus} onClick={() => setCreateModalOpen(true)}>
            Request Time Off
          </Button>
        </div>
      )}

      {approvalError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start space-x-2.5">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-semibold">Approval Blocked</div>
            <div className="mt-0.5">{approvalError.message}</div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        emptyTitle="No time off requests"
        emptyDescription="No leave applications found matching current criteria."
      />

      <TimeOffRequestModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        defaultEmployeeId={employeeId}
      />

      <RefusalReasonModal
        isOpen={Boolean(refusalModalTarget)}
        onClose={() => setRefusalModalTarget(null)}
        isLoading={refuseMutation.isPending}
        onConfirm={handleRefuseConfirm}
        title="Refuse Leave Request"
      />
    </div>
  );
}
