import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { usePagination } from '@/hooks/usePagination';
import { useTimeOffTypes, useDeleteTimeOffType } from '../hooks/useTimeOff';
import { TimeOffTypeModal } from './TimeOffTypeModal';

export function TimeOffTypesTable({ canCreate = true }) {
  const { page, limit, onPageChange, onLimitChange } = usePagination(1, 10);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const { data, isLoading } = useTimeOffTypes({
    page,
    limit,
    sortBy: 'name',
    order: 'asc',
  });

  const deleteMutation = useDeleteTimeOffType();

  const handleOpenEdit = (type) => {
    setSelectedType(type);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedType(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this time off type?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (code) => <span className="font-mono font-semibold text-slate-800">{code}</span>,
    },
    {
      key: 'name',
      header: 'Type Name',
      render: (name) => <span className="font-semibold text-slate-900">{name}</span>,
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (unit) => <Badge variant="slate">{unit}</Badge>,
    },
    {
      key: 'requiresAllocation',
      header: 'Requires Quota',
      render: (val) =>
        val ? (
          <span className="inline-flex items-center text-[11px] text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Yes
          </span>
        ) : (
          <span className="inline-flex items-center text-[11px] text-slate-400">
            <XCircle className="h-3.5 w-3.5 mr-1" /> Unlimited
          </span>
        ),
    },
    {
      key: 'approvalRequired',
      header: 'Approval',
      render: (val) =>
        val ? (
          <span className="text-[11px] text-amber-700 font-medium">Required</span>
        ) : (
          <span className="text-[11px] text-slate-500">Auto-approved</span>
        ),
    },
    {
      key: 'isPaid',
      header: 'Compensation',
      render: (val) => (
        <Badge variant={val ? 'emerald' : 'rose'}>{val ? 'Paid' : 'Unpaid'}</Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (isActive) => (
        <StatusPill status={isActive ? 'ACTIVE' : 'SUSPENDED'} label={isActive ? 'Active' : 'Inactive'} size="xs" />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="xs"
            leftIcon={Edit2}
            onClick={() => handleOpenEdit(row)}
          >
            Edit
          </Button>
          {row.isActive && (
            <Button
              variant="ghost"
              size="xs"
              className="text-rose-600 hover:bg-rose-50"
              leftIcon={Trash2}
              onClick={() => handleDelete(row.id)}
            >
              Deactivate
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
          <Button variant="primary" size="xs" leftIcon={Plus} onClick={handleOpenCreate}>
            New Leave Type
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
        emptyTitle="No time off types configured"
        emptyDescription="Define leave types like Paid Leave, Sick Leave, or Maternity."
      />

      <TimeOffTypeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={selectedType}
      />
    </div>
  );
}
