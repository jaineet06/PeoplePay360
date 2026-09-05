import React, { useState } from 'react';
import { Clock, Filter, Layers, PieChart, FileText } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { TimeOffRequestsTable } from './components/TimeOffRequestsTable';
import { TimeOffAllocationsTable } from './components/TimeOffAllocationsTable';
import { TimeOffTypesTable } from './components/TimeOffTypesTable';
import { useManagersLookup } from '@/features/employees/hooks/useLookups';
import { useTimeOffTypes } from './hooks/useTimeOff';

export function TimeOffPage() {
  const [activeTab, setActiveTab] = useState('requests');
  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [status, setStatus] = useState('');

  const { data: employeesData } = useManagersLookup();
  const { data: typesData } = useTimeOffTypes();

  const employeeOptions = [
    { value: '', label: 'All Employees' },
    ...(employeesData || []).map((e) => ({
      value: e.id,
      label: `${e.fullName} (${e.employeeCode})`,
    })),
  ];

  const typeOptions = [
    { value: '', label: 'All Leave Types' },
    ...(typesData?.data || []).map((t) => ({
      value: t.id,
      label: `${t.name} (${t.code})`,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REFUSED', label: 'Refused' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const tabs = [
    { id: 'requests', label: 'Leave Requests' },
    { id: 'allocations', label: 'Quotas & Balances' },
    { id: 'types', label: 'Leave Policy Types' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
            <Clock className="h-6 w-6 text-brand-600" />
            Time Off &amp; Leave Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review time-off requests, allocate annual quotas, and manage policy leave types
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Filter Toolbar for Requests & Allocations */}
      {activeTab !== 'types' && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
          <div className="w-56">
            <Select
              options={employeeOptions}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </div>

          <div className="w-52">
            <Select
              options={typeOptions}
              value={timeOffTypeId}
              onChange={(e) => setTimeOffTypeId(e.target.value)}
            />
          </div>

          <div className="w-40">
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Content per tab */}
      {activeTab === 'requests' && (
        <TimeOffRequestsTable
          employeeId={employeeId || null}
          timeOffTypeId={timeOffTypeId}
          status={status}
          canCreate={true}
        />
      )}

      {activeTab === 'allocations' && (
        <TimeOffAllocationsTable
          employeeId={employeeId || null}
          timeOffTypeId={timeOffTypeId}
          status={status}
          canCreate={true}
        />
      )}

      {activeTab === 'types' && (
        <TimeOffTypesTable canCreate={true} />
      )}
    </div>
  );
}

export default TimeOffPage;
