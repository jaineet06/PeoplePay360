import React, { useState } from 'react';
import { Search, Filter, FileSpreadsheet, Plus } from 'lucide-react';
import { ContractsTable } from './components/ContractsTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useDebounce } from '@/hooks/useDebounce';
import { useManagersLookup } from '@/features/employees/hooks/useLookups';
import { ContractModal } from './components/ContractModal';

export function ContractsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: employeesData } = useManagersLookup();

  const employeeOptions = [
    { value: '', label: 'All Employees' },
    ...(employeesData || []).map((e) => ({
      value: e.id,
      label: `${e.fullName} (${e.employeeCode})`,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'TERMINATED', label: 'Terminated' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-brand-600" />
            Contracts Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review employment agreements, compensation rates, and active salary structure assignments
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={Plus}
          onClick={() => setCreateModalOpen(true)}
        >
          New Contract
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by contract reference or title..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select
              options={employeeOptions}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </div>

          <div className="w-36">
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <ContractsTable
        employeeId={employeeId || null}
        status={status}
        search={debouncedSearch}
        canCreate={false} // Top bar button handles creation
      />

      <ContractModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}

export default ContractsPage;
