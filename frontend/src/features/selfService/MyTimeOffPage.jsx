import React, { useState } from 'react';
import { Clock, Plus, PieChart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { TimeOffRequestsTable } from '@/features/timeOff/components/TimeOffRequestsTable';
import { TimeOffRequestModal } from '@/features/timeOff/components/TimeOffRequestModal';
import { useTimeOffAllocations } from '@/features/timeOff/hooks/useTimeOff';

export function MyTimeOffPage() {
  const [modalOpen, setModalOpen] = useState(false);

  // Scoped to employee via token
  const { data: allocationsData, isLoading: isAllocLoading } = useTimeOffAllocations({
    page: 1,
    limit: 50,
  });

  const allocations = allocationsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
            <Clock className="h-6 w-6 text-brand-600" />
            My Time Off &amp; Leave Balances
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Check available leave quotas and submit new time off applications
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Request Time Off
        </Button>
      </div>

      {/* Quota Balance Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Current Leave Quotas &amp; Balances
        </h2>

        {isAllocLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : allocations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allocations.map((alloc) => {
              const remaining = alloc.remainingUnits !== undefined
                ? Number(alloc.remainingUnits)
                : Number(alloc.allocatedUnits) - Number(alloc.takenUnits);

              return (
                <div
                  key={alloc.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-xs">
                      {alloc.timeOffType?.name || 'Leave'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {alloc.timeOffType?.unit}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        {remaining.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        Remaining Available
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-500">
                      <div>Total: {Number(alloc.allocatedUnits).toFixed(1)}</div>
                      <div>Used: {Number(alloc.takenUnits).toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            No active leave quotas assigned. Contact your HR administrator.
          </div>
        )}
      </div>

      {/* Requests History Table */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Leave Applications History
        </h2>

        <TimeOffRequestsTable
          canCreate={false} // Header button triggers modal
          hideEmployeeColumn={true}
        />
      </div>

      <TimeOffRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

export default MyTimeOffPage;
