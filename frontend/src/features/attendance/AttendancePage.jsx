import React, { useState } from 'react';
import { CalendarCheck2, Filter, Calendar } from 'lucide-react';
import { AttendanceTable } from './components/AttendanceTable';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useManagersLookup } from '@/features/employees/hooks/useLookups';

export function AttendancePage() {
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
    { value: 'PRESENT', label: 'Present' },
    { value: 'LATE', label: 'Late' },
    { value: 'OVERTIME', label: 'Overtime' },
    { value: 'HALF_DAY', label: 'Half Day' },
    { value: 'MISSING_CHECKOUT', label: 'Missing Checkout' },
    { value: 'ABSENT', label: 'Absent' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
            <CalendarCheck2 className="h-6 w-6 text-brand-600" />
            Attendance Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor daily employee check-ins, worked hours, and administrative corrections
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="w-full">
          <Select
            label="Filter by Employee"
            options={employeeOptions}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
        </div>

        <div className="w-full">
          <Select
            label="Attendance Status"
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>

        <div className="w-full">
          <Input
            type="date"
            label="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="w-full">
          <Input
            type="date"
            label="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <AttendanceTable
        employeeId={employeeId || null}
        status={status}
        dateFrom={dateFrom}
        dateTo={dateTo}
        readOnly={false}
      />
    </div>
  );
}

export default AttendancePage;
