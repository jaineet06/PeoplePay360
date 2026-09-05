import React from 'react';
import { Mail, CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function SendSummaryModal({ isOpen, onClose, summary }) {
  if (!summary) return null;

  const sentList = summary.sent || [];
  const failedList = summary.failed || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Payslip Email Delivery Report"
      description="Delivery confirmation status per employee"
      footer={
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Count overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xl font-bold text-emerald-900">{sentList.length}</div>
              <div className="text-emerald-700">Delivered Successfully</div>
            </div>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3">
            <XCircle className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <div className="text-xl font-bold text-rose-900">{failedList.length}</div>
              <div className="text-rose-700">Failed / Bounced</div>
            </div>
          </div>
        </div>

        {/* Failed items list if any */}
        {failedList.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-rose-800">Failed Deliveries</div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {failedList.map((f, i) => (
                <div key={i} className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="font-semibold text-slate-800">{f.email || f.employeeId}</div>
                  <div className="text-rose-700">{f.error || 'Delivery failed.'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent items list */}
        {sentList.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-slate-800">Sent Receipts</div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1 divide-y divide-slate-100">
              {sentList.map((s, i) => (
                <div key={i} className="py-1.5 flex items-center justify-between text-slate-600">
                  <span className="font-medium text-slate-800">{s.email}</span>
                  <span className="font-mono text-[11px] text-slate-400">{s.reference}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
