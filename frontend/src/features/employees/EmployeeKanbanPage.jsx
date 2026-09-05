import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Mail,
  Building2,
  Briefcase,
  X,
  GripVertical,
} from 'lucide-react';
import { useEmployeeKanban } from './hooks/useEmployeeKanban';
import { useKanbanStatusUpdate } from './hooks/useEmployeeMutations';
import { useDepartmentsLookup } from './hooks/useLookups';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { getInitials } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export function EmployeeKanbanPage() {
  const navigate = useNavigate();

  const [groupBy, setGroupBy] = useState('status');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [departmentFilter, setDepartmentFilter] = useState('');

  const kanbanParams = {
    groupBy,
    search: debouncedSearch || undefined,
    departmentId: departmentFilter || undefined,
  };

  const statusUpdateMutation = useKanbanStatusUpdate(kanbanParams);
  const { data: departments = [] } = useDepartmentsLookup();
  const { data: kanbanData, isLoading } = useEmployeeKanban(kanbanParams);

  const groups = kanbanData?.groups || [];
  const dragEnabled = groupBy === 'status';

  const handleDragEnd = (result) => {
    const { draggableId, source, destination } = result;
    if (!destination || !dragEnabled) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    statusUpdateMutation.mutate({
      id: draggableId,
      status: destination.droppableId,
      fromStatus: source.droppableId,
      toStatus: destination.droppableId,
      destinationIndex: destination.index,
    });
  };

  const renderEmployeeCard = (emp, index, draggable = false) => {
    const cardBody = (
      <>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            {draggable && (
              <GripVertical className="h-3.5 w-3.5 text-slate-300 shrink-0 cursor-grab active:cursor-grabbing" />
            )}
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0 group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
              {getInitials(emp.fullName)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                {emp.fullName}
              </div>
              <div className="text-[10px] font-mono text-slate-400">{emp.employeeCode}</div>
            </div>
          </div>
          {dragEnabled && <StatusPill status={emp.status} size="xs" />}
        </div>

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
      </>
    );

    if (!draggable) {
      return (
        <div
          key={emp.id}
          onClick={() => navigate(`/employees/${emp.id}`)}
          className="p-3 bg-white rounded-lg border border-slate-200 shadow-card hover:shadow-dropdown hover:border-brand-300 transition-all cursor-pointer group"
        >
          {cardBody}
        </div>
      );
    }

    return (
      <Draggable key={emp.id} draggableId={emp.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => navigate(`/employees/${emp.id}`)}
            className={cn(
              'p-3 bg-white rounded-lg border shadow-card transition-all cursor-pointer group',
              snapshot.isDragging
                ? 'border-brand-400 shadow-dropdown ring-2 ring-brand-200 rotate-1'
                : 'border-slate-200 hover:shadow-dropdown hover:border-brand-300'
            )}
          >
            {cardBody}
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Employees Kanban</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag cards between status columns to update employee lifecycle state.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-subtle">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 shadow-xs"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => navigate('/employees/new')}>
            Add Employee
          </Button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-card flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
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

      {!dragEnabled && (
        <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 shrink-0">
          Drag-and-drop is available when grouping by <strong>Status</strong>. Switch back to update lifecycle states visually.
        </p>
      )}

      <div className="flex-1 overflow-x-auto pb-4">
        {isLoading ? (
          <div className="flex space-x-4 h-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-72 shrink-0 bg-slate-100/70 rounded-xl p-3 space-y-3">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState title="No kanban data" description="No employee records match the active criteria." />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex space-x-4 h-full items-start min-h-[420px]">
              {groups.map((group) => (
                <div
                  key={group.key || group.label}
                  className="w-76 shrink-0 bg-slate-100/80 rounded-xl border border-slate-200/80 flex flex-col max-h-full shadow-subtle"
                >
                  <div className="p-3 border-b border-slate-200/80 flex items-center justify-between bg-white/70 rounded-t-xl">
                    <div className="flex items-center space-x-2">
                      {groupBy === 'status' ? (
                        <StatusPill status={group.key} size="xs" />
                      ) : (
                        <span className="text-xs font-semibold text-slate-800">{group.label}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {group.count}
                    </span>
                  </div>

                  <Droppable droppableId={group.key} isDropDisabled={!dragEnabled}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'p-2 space-y-2.5 overflow-y-auto flex-1 min-h-[120px] transition-colors rounded-b-xl',
                          snapshot.isDraggingOver && dragEnabled && 'bg-brand-50/60 ring-1 ring-inset ring-brand-200'
                        )}
                      >
                        {group.employees.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">Drop employees here</div>
                        ) : (
                          group.employees.map((emp, index) =>
                            renderEmployeeCard(emp, index, dragEnabled)
                          )
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}

export default EmployeeKanbanPage;
