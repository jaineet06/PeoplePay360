import React, { useState } from 'react';
import { Edit2, Trash2, Plus, Sparkles, FileSpreadsheet } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { usePagination } from '@/hooks/usePagination';
import { useContracts, useDeleteContract } from '../hooks/useContracts';
import { ContractModal } from './ContractModal';

export function ContractsTable({
  employeeId = null,
  canCreate = true,
  search = '',
  status = '',
  hideEmployeeColumn = false,
}) {
  const { page, limit, onPageChange, onLimitChange } = usePagination(1, 10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [deleteContractId, setDeleteContractId] = useState(null);

  const { data, isLoading } = useContracts({
    page,
    limit,
    employeeId: employeeId || undefined,
    status: status || undefined,
    search: search || undefined,
    sortBy: 'startDate',
    order: 'desc',
  });

  const deleteMutation = useDeleteContract();

  const handleOpenEdit = (contract) => {
    setEditingContract(contract);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingContract(null);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteContractId) return;
    try {
      await deleteMutation.mutateAsync(deleteContractId);
      setDeleteContractId(null);
    } catch {
      // Toast handles error
    }
  };

  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (ref, row) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono font-semibold text-slate-800">{ref || '—'}</span>
          {row.isCurrentlyActive && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Sparkles className="h-2.5 w-2.5 mr-1 text-emerald-600" />
              CURRENT ACTIVE
            </span>
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
      key: 'salaryStructure',
      header: 'Structure',
      render: (_, row) => (
        <span className="text-slate-700 font-medium">
          {row.salaryStructure?.name || 'Standard'}
        </span>
      ),
    },
    {
      key: 'wage',
      header: 'Wage / Rate',
      render: (wage, row) => (
        <div className="font-semibold text-slate-900">
          {formatCurrency(wage, row.currency || 'INR')}
          <span className="text-[10px] text-slate-500 font-normal ml-1">
            /{row.wageType ? row.wageType.toLowerCase() : 'month'}
          </span>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (_, row) => (
        <span className="text-slate-600">
          {formatDate(row.startDate)} &rarr; {row.endDate ? formatDate(row.endDate) : 'Permanent'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (st, row) => (
        <div className="flex items-center space-x-1.5">
          <StatusPill status={st} size="xs" />
        </div>
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
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
          >
            Edit
          </Button>
          {row.status !== 'CANCELLED' && (
            <Button
              variant="ghost"
              size="xs"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              leftIcon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteContractId(row.id);
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
          <Button variant="primary" size="xs" leftIcon={Plus} onClick={handleOpenCreate}>
            New Contract
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
        emptyTitle="No contracts found"
        emptyDescription="No contract records match the active criteria."
        emptyAction={
          canCreate ? (
            <Button variant="outline" size="sm" leftIcon={Plus} onClick={handleOpenCreate}>
              Draft New Contract
            </Button>
          ) : null
        }
      />

      <ContractModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        contract={editingContract}
        defaultEmployeeId={employeeId}
      />

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteContractId)}
        onClose={() => setDeleteContractId(null)}
        title="Cancel Contract"
        description="Contract status update confirmation"
        footer={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteContractId(null)}>
              Dismiss
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              Confirm Cancel
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to cancel this contract? Once cancelled, it will no longer be considered for payroll calculations.
        </p>
      </Modal>
    </div>
  );
}
