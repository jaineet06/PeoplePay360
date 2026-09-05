import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Eye,
  Edit2,
  Trash2,
  Users,
  Filter,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useEmployees } from './hooks/useEmployees';
import { useDeleteEmployee } from './hooks/useEmployeeMutations';
import { useDepartmentsLookup } from './hooks/useLookups';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import { formatDate, getInitials } from '@/utils/formatters';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_NOTICE', label: 'On Notice' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'EXITED', label: 'Exited' },
];

export function EmployeeListPage() {
  const navigate = useNavigate();

  // Filters and pagination state
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const deleteEmployeeMutation = useDeleteEmployee();

  // Lookups
  const { data: departments = [] } = useDepartmentsLookup();

  // Fetch employees list
  const { data: queryResult, isLoading } = useEmployees({
    page,
    limit,
    sortBy,
    order,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    departmentId: departmentFilter || undefined,
  });

  const employees = queryResult?.data || [];
  const meta = queryResult?.meta || { page, limit, total: 0, totalPages: 1 };

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnKey);
      setOrder('asc');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmployeeMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Handled by mutation onError
    }
  };

  const hasActiveFilters = Boolean(searchInput || statusFilter || departmentFilter);

  const resetFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setDepartmentFilter('');
    setPage(1);
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Employee',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0">
            {getInitials(row.fullName || row.firstName)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 hover:text-brand-600 transition-colors truncate">
              {row.fullName}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {row.employeeCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'workEmail',
      header: 'Work Email',
      sortable: true,
      render: (email) => (
        <span className="text-slate-600 truncate block max-w-[200px]" title={email}>
          {email}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: false,
      render: (_, row) => (
        <span className="text-slate-700">
          {row.department?.name || <span className="text-slate-400">Unassigned</span>}
        </span>
      ),
    },
    {
      key: 'jobPosition',
      header: 'Job Title',
      sortable: false,
      render: (_, row) => (
        <span className="text-slate-700">
          {row.jobPosition?.title || <span className="text-slate-400">—</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (status) => <StatusPill status={status} size="sm" />,
    },
    {
      key: 'dateOfJoining',
      header: 'Joined Date',
      sortable: true,
      render: (date) => (
        <span className="text-slate-600 whitespace-nowrap">{formatDate(date)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (_, row) => (
        <div
          className="flex items-center justify-end space-x-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => navigate(`/employees/${row.id}`)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded transition-colors"
            title="View Profile"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/employees/${row.id}/edit`)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded transition-colors"
            title="Edit Employee"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Delete Employee"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Employees Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization staff profiles, employment status, and related records.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* List vs Kanban View Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-subtle">
            <button
              type="button"
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 shadow-xs"
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/employees/kanban')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900"
              title="Kanban View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => navigate('/employees/new')}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1 text-slate-400 text-xs">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-slate-500 font-medium">Filters:</span>
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-md border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-md border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={resetFilters}
              className="text-slate-500 hover:text-slate-800"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        sortBy={sortBy}
        order={order}
        onSort={handleSort}
        meta={meta}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        onRowClick={(row) => navigate(`/employees/${row.id}`)}
        emptyTitle="No employees found"
        emptyDescription={
          hasActiveFilters
            ? 'No employees match your active search or filters.'
            : 'No employees have been registered yet. Add your first employee to get started.'
        }
        emptyAction={
          hasActiveFilters ? (
            <Button variant="secondary" size="xs" onClick={resetFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button
              variant="primary"
              size="xs"
              leftIcon={Plus}
              onClick={() => navigate('/employees/new')}
            >
              Add Employee
            </Button>
          )
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Employee Record"
        description="Are you sure you want to remove this employee?"
        footer={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteEmployeeMutation.isPending}
              onClick={handleConfirmDelete}
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">
                Soft-Deletion Policy:
              </span>
              This action will mark{' '}
              <strong>{deleteTarget?.fullName}</strong> ({deleteTarget?.employeeCode}) as
              EXITED and uncouple any linked login user. Note that employees with an{' '}
              <strong>ACTIVE contract</strong> cannot be deleted until their contract has been
              terminated.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default EmployeeListPage;
