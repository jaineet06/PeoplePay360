import React, { useState } from 'react';
import {
  CalendarRange,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { useSchedules, useDeleteSchedule } from './hooks/useSchedules';
import { ScheduleModal } from './components/ScheduleModal';

export function SchedulesPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const { page, limit, onPageChange, onLimitChange } = usePagination(1, 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const deleteMutation = useDeleteSchedule();

  const { data: queryResult, isLoading } = useSchedules({
    page,
    limit,
    search: debouncedSearch || undefined,
    sortBy: 'name',
    order: 'asc',
  });

  const schedules = queryResult?.data || [];
  const meta = queryResult?.meta || { page, limit, total: 0, totalPages: 1 };

  const handleOpenCreate = () => {
    setSelectedSchedule(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Handled by onError in hook
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Schedule Name',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
            <CalendarRange className="h-3.5 w-3.5 text-brand-600 shrink-0" />
            <span>{row.name}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {row.code}
          </div>
        </div>
      ),
    },
    {
      key: 'hoursPerWeek',
      header: 'Weekly Hours',
      render: (val) => (
        <div className="flex items-center space-x-1.5">
          <Badge variant="primary" size="sm">
            {Number(val || 0).toFixed(2)} hrs/wk
          </Badge>
        </div>
      ),
    },
    {
      key: 'workingDaysPerWeek',
      header: 'Working Days',
      render: (val) => (
        <span className="text-xs text-slate-700 font-medium">
          {val} days / week
        </span>
      ),
    },
    {
      key: 'employeeCount',
      header: 'Assigned Headcount',
      render: (val) => (
        <div className="flex items-center space-x-1.5 text-xs text-slate-600">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {val ?? 0}
          </span>
          <span className="text-slate-400 text-[11px]">employees</span>
        </div>
      ),
    },
    {
      key: 'timezone',
      header: 'Timezone',
      render: (val) => (
        <span className="text-xs text-slate-600 font-mono">
          {val || 'Asia/Kolkata'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (val) => (
        <StatusPill status={val ? 'ACTIVE' : 'EXPIRED'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            type="button"
            aria-label={`Edit ${row.name}`}
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Edit Schedule Pattern"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            aria-label={`Deactivate ${row.name}`}
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Deactivate Schedule"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-brand-600" />
            Working Schedules
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure working hours, weekly shift patterns, and corporate schedules across departments
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={Plus}
          onClick={handleOpenCreate}
        >
          New Schedule
        </Button>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onPageChange(1);
            }}
            placeholder="Search schedules by name or code..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <DataTable
          columns={columns}
          data={schedules}
          isLoading={isLoading}
          meta={meta}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          emptyTitle="No working schedules found"
          emptyDescription={
            search
              ? 'No working schedule matches your search keyword.'
              : 'Start by defining standard 40h or flexible working schedules for your organization.'
          }
          emptyAction={
            !search && (
              <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={Plus}>
                Create Schedule
              </Button>
            )
          }
        />
      </div>

      {/* Create / Edit Modal */}
      <ScheduleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        schedule={selectedSchedule}
      />

      {/* Deactivate Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Deactivate Working Schedule"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-full bg-amber-50 text-amber-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Are you sure you want to deactivate{' '}
                  <strong className="text-slate-900">{deleteTarget.name}</strong>?
                </p>
                {deleteTarget.employeeCount > 0 ? (
                  <div className="mt-2 rounded-md bg-rose-50 p-2 border border-rose-200 text-rose-700 text-[11px] font-medium">
                    ⚠️ {deleteTarget.employeeCount} active employee(s) are currently assigned to this schedule. Deactivation will be blocked by the server until they are reassigned.
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    This schedule has 0 assigned employees and will be marked inactive.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={deleteMutation.isPending}
                disabled={deleteMutation.isPending}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SchedulesPage;
