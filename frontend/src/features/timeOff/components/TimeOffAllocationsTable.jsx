import React, { useState } from 'react';
import { Plus, Check, X, PieChart } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate } from '@/utils/formatters';
import { usePagination } from '@/hooks/usePagination';
import {
  useTimeOffAllocations,
  useApproveAllocation,
  useRefuseAllocation,
} from '../hooks/useTimeOff';
import { TimeOffAllocationModal } from './TimeOffAllocationModal';
import { RefusalReasonModal } from './RefusalReasonModal';
import { useAuthStore } from '@/features/auth/authStore';
import { toast } from '@/components/ui/Toast';

export function TimeOffAllocationsTable({
  employeeId = null,
  timeOffTypeId = '',
  status = '',
  canCreate = true,
  hideEmployeeColumn = false,
}) {
  const { page, limit, onPageChange, onLimitChange } = usePagination(1, 10);
  const [modalOpen, setModalOpen] = useState(false);
  const [refuseTarget, setRefuseTarget] = useState(null);

  const user = useAuthStore((state) => state.user);
  const isHr = ['HR_MANAGER', 'ADMIN'].includes(user?.role);

  const { data, isLoading } = useTimeOffAllocations({
    page,
    limit,
    employeeId: employeeId || undefined,
    timeOffTypeId: timeOffTypeId || undefined,
    status: status || undefined,
    sortBy: 'validFrom',
    order: 'desc',
  });

  const approveMutation = useApproveAllocation();
  const refuseMutation = useRefuseAllocation();

  const handleApprove = async (id) => {
    try {
      await approveMutation.mutateAsync(id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve allocation');
    }
  };

  const handleRefuseConfirm = async (reason) => {
    if (!refuseTarget) return;
    try {
      await refuseMutation.mutateAsync({
        id: refuseTarget.id,
        data: { refusalReason: reason },
      });
      setRefuseTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refuse allocation');
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
      key: 'validity',
      header: 'Validity Period',
      render: (_, row) => (
        <span className="text-slate-600">
          {formatDate(row.validFrom)} &rarr; {formatDate(row.validTo)}
        </span>
      ),
    },
    {
      key: 'allocatedUnits',
      header: 'Allocated',
      render: (u, row) => (
        <span className="font-medium text-slate-700">
          {Number(u).toFixed(1)} {row.timeOffType?.unit?.toLowerCase() || 'days'}
        </span>
      ),
    },
    {
      key: 'takenUnits',
      header: 'Taken',
      render: (u, row) => (
        <span className="font-medium text-slate-500">
          {Number(u).toFixed(1)} {row.timeOffType?.unit?.toLowerCase() || 'days'}
        </span>
      ),
    },
    {
      key: 'remainingUnits',
      header: 'Remaining Balance',
      render: (r, row) => {
        const val = r !== undefined ? Number(r) : Number(row.allocatedUnits) - Number(row.takenUnits);
        return (
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {val.toFixed(1)} {row.timeOffType?.unit?.toLowerCase() || 'days'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (st, row) => (
        <div className="space-y-1">
          <StatusPill status={st} size="xs" />
          {row.notes && <div className="text-[10px] text-slate-400 max-w-xs truncate">{row.notes}</div>}
        </div>
      ),
    },
    ...(isHr
      ? [
          {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (_, row) => (
              <div className="flex items-center justify-end space-x-1.5">
                {row.status === 'PENDING' && (
                  <>
                    <Button
                      variant="primary"
                      size="xs"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      leftIcon={Check}
                      isLoading={approveMutation.isPending && approveMutation.variables === row.id}
                      onClick={() => handleApprove(row.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-rose-600 hover:bg-rose-50"
                      leftIcon={X}
                      onClick={() => setRefuseTarget(row)}
                    >
                      Refuse
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {canCreate && isHr && (
        <div className="flex justify-end">
          <Button variant="primary" size="xs" leftIcon={Plus} onClick={() => setModalOpen(true)}>
            Grant Allocation
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        emptyTitle="No allocations found"
        emptyDescription="No leave quotas or balance allocations match current filters."
      />

      <TimeOffAllocationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultEmployeeId={employeeId}
      />

      <RefusalReasonModal
        isOpen={Boolean(refuseTarget)}
        onClose={() => setRefuseTarget(null)}
        isLoading={refuseMutation.isPending}
        onConfirm={handleRefuseConfirm}
        title="Refuse Leave Allocation"
      />
    </div>
  );
}
