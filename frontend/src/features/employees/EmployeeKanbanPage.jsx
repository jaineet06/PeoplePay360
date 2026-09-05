import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Mail,
  Building2,
  Briefcase,
  ChevronDown,
  X,
  User,
} from 'lucide-react';
import { useEmployeeKanban } from './hooks/useEmployeeKanban';
import { useUpdateEmployee } from './hooks/useEmployeeMutations';
import { useDepartmentsLookup } from './hooks/useLookups';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { getInitials } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const ALL_STATUSES = ['ONBOARDING', 'ACTIVE', 'ON_NOTICE', 'SUSPENDED', 'EXITED'];

export function EmployeeKanbanPage() {
  const navigate = useNavigate();

  const [groupBy, setGroupBy] = useState('status'); // 'status' | 'department'
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Update employee status mutation
  const updateEmployeeMutation = useUpdateEmployee();

  // Departments lookup for filter
  const { data: departments = [] } = useDepartmentsLookup();

  // Query kanban data
  const { data: kanbanData, isLoading } = useEmployeeKanban({
    groupBy,
    search: debouncedSearch,
    departmentId: departmentFilter,
  });

  const groups = kanbanData?.groups || [];

  const handleStatusChange = async (employeeId, newStatus) => {
    try {
      await updateEmployeeMutation.mutateAsync({
        id: employeeId,
        payload: { status: newStatus },
      });
    } catch {
      // Handled by mutation onError
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Employees Kanban
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize workforce distribution by status or department.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* List vs Kanban View Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-subtle">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900"
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 shadow-xs"
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

      {/* Controls Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-card flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search employees..."
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

        {/* Group By & Filter Options */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="font-medium text-slate-500">Group by:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="text-xs rounded-md border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="status">Status</option>
              <option value="department">Department</option>
            </select>
          </div>

          {groupBy === 'status' && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs rounded-md border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Kanban Columns Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        {isLoading ? (
          <div className="flex space-x-4 h-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-72 shrink-0 bg-slate-100/70 rounded-xl p-3 space-y-3"
              >
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              title="No kanban data"
              description="No employee records match the active criteria."
            />
          </div>
        ) : (
          <div className="flex space-x-4 h-full items-start">
            {groups.map((group) => (
              <div
                key={group.key || group.label}
                className="w-76 shrink-0 bg-slate-100/80 rounded-xl border border-slate-200/80 flex flex-col max-h-full shadow-subtle"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-200/80 flex items-center justify-between bg-white/70 rounded-t-xl">
                  <div className="flex items-center space-x-2">
                    {groupBy === 'status' ? (
                      <StatusPill status={group.key} size="xs" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-800">
                        {group.label}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {group.count}
                  </span>
                </div>

                {/* Column Cards List */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {group.employees.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Empty column
                    </div>
                  ) : (
                    group.employees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="p-3 bg-white rounded-lg border border-slate-200 shadow-card hover:shadow-dropdown hover:border-brand-300 transition-all cursor-pointer group"
                      >
                        {/* Employee Avatar & Name */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0 group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
                              {getInitials(emp.fullName)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                                {emp.fullName}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {emp.employeeCode}
                              </div>
                            </div>
                          </div>

                          {/* Quick Status Select */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0"
                          >
                            <select
                              value={emp.status}
                              onChange={(e) =>
                                handleStatusChange(emp.id, e.target.value)
                              }
                              className="text-[10px] rounded border border-slate-200 bg-slate-50 py-0.5 px-1 font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                              title="Click to transition status"
                            >
                              {ALL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Meta lines */}
                        <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          {emp.jobPosition?.title && (
                            <div className="flex items-center space-x-1.5 truncate">
                              <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{emp.jobPosition.title}</span>
                            </div>
                          )}

                          {emp.department?.name && (
                            <div className="flex items-center space-x-1.5 truncate">
                              <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{emp.department.name}</span>
                            </div>
                          )}

                          <div className="flex items-center space-x-1.5 truncate text-slate-400">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{emp.workEmail}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeKanbanPage;
