import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import {
  useDepartments,
  useJobPositions,
  useDeleteDepartment,
  useDeleteJobPosition,
} from './hooks/useDepartments';
import { DepartmentModal } from './components/DepartmentModal';
import { JobPositionModal } from './components/JobPositionModal';

export function DepartmentsPage() {
  const [activeTab, setActiveTab] = useState('departments');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const { page, limit, onPageChange, onLimitChange } = usePagination(1, 10);

  // Modals state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const [posModalOpen, setPosModalOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState(null);

  // Delete modal state
  const [deleteItem, setDeleteItem] = useState(null); // { type: 'department' | 'position', item }
  const [deleteError, setDeleteError] = useState(null);

  // Queries
  const {
    data: deptsData,
    isLoading: isDeptsLoading,
  } = useDepartments({
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const {
    data: posData,
    isLoading: isPosLoading,
  } = useJobPositions({
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const deleteDeptMutation = useDeleteDepartment();
  const deletePosMutation = useDeleteJobPosition();

  const handleOpenCreate = () => {
    if (activeTab === 'departments') {
      setSelectedDept(null);
      setDeptModalOpen(true);
    } else {
      setSelectedPos(null);
      setPosModalOpen(true);
    }
  };

  const handleOpenEdit = (item) => {
    if (activeTab === 'departments') {
      setSelectedDept(item);
      setDeptModalOpen(true);
    } else {
      setSelectedPos(item);
      setPosModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleteError(null);
    try {
      if (deleteItem.type === 'department') {
        await deleteDeptMutation.mutateAsync(deleteItem.item.id);
      } else {
        await deletePosMutation.mutateAsync(deleteItem.item.id);
      }
      setDeleteItem(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed. Could not deactivate record.';
      setDeleteError(msg);
    }
  };

  const tabs = [
    { id: 'departments', label: 'Departments', badge: deptsData?.meta?.total },
    { id: 'positions', label: 'Job Positions', badge: posData?.meta?.total },
  ];

  const departmentColumns = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (code) => <span className="font-mono font-semibold text-slate-800">{code}</span>,
    },
    {
      key: 'name',
      header: 'Department Name',
      sortable: true,
      render: (name, row) => (
        <div>
          <div className="font-semibold text-slate-900">{name}</div>
          {row.description && (
            <div className="text-[11px] text-slate-500 line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'employeeCount',
      header: 'Active Employees',
      render: (count) => (
        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {count || 0}
        </span>
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
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            leftIcon={Trash2}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteError(null);
              setDeleteItem({ type: 'department', item: row });
            }}
          >
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  const positionColumns = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (code) => <span className="font-mono font-semibold text-slate-800">{code}</span>,
    },
    {
      key: 'title',
      header: 'Job Title',
      sortable: true,
      render: (title, row) => (
        <div>
          <div className="font-semibold text-slate-900">{title}</div>
          {row.description && (
            <div className="text-[11px] text-slate-500 line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'employeeCount',
      header: 'Assigned Employees',
      render: (count) => (
        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {count || 0}
        </span>
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
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            leftIcon={Trash2}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteError(null);
              setDeleteItem({ type: 'position', item: row });
            }}
          >
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Organization Setup
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage company departments and standardized job positions
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenCreate}>
          {activeTab === 'departments' ? 'New Department' : 'New Position'}
        </Button>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); onPageChange(1); }} />

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onPageChange(1);
            }}
            placeholder={activeTab === 'departments' ? 'Search departments...' : 'Search job titles...'}
            className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Tables */}
      {activeTab === 'departments' ? (
        <DataTable
          columns={departmentColumns}
          data={deptsData?.data || []}
          isLoading={isDeptsLoading}
          meta={deptsData?.meta}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          emptyTitle="No departments found"
          emptyDescription={debouncedSearch ? 'Try a different search query.' : 'Get started by creating your first department.'}
        />
      ) : (
        <DataTable
          columns={positionColumns}
          data={posData?.data || []}
          isLoading={isPosLoading}
          meta={posData?.meta}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          emptyTitle="No job positions found"
          emptyDescription={debouncedSearch ? 'Try a different search query.' : 'Get started by creating your first job position.'}
        />
      )}

      {/* Modals */}
      <DepartmentModal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        department={selectedDept}
      />

      <JobPositionModal
        isOpen={posModalOpen}
        onClose={() => setPosModalOpen(false)}
        position={selectedPos}
      />

      {/* Delete / Deactivate Guard Modal */}
      <Modal
        isOpen={Boolean(deleteItem)}
        onClose={() => {
          setDeleteItem(null);
          setDeleteError(null);
        }}
        title={`Deactivate ${deleteItem?.type === 'department' ? 'Department' : 'Job Position'}`}
        description="Verify active assignments before proceeding"
        footer={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteItem(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteDeptMutation.isPending || deletePosMutation.isPending}
              onClick={handleConfirmDelete}
            >
              Confirm Deactivation
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start space-x-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-900">Deactivation Blocked</div>
                <div className="mt-0.5 leading-relaxed">{deleteError}</div>
              </div>
            </div>
          )}

          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to deactivate{' '}
            <strong>
              {deleteItem?.type === 'department' ? deleteItem?.item.name : deleteItem?.item.title}
            </strong>{' '}
            ({deleteItem?.item.code})?
          </p>

          <p className="text-[11px] text-slate-500">
            Records with actively assigned personnel cannot be deleted until employees are reassigned.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default DepartmentsPage;
