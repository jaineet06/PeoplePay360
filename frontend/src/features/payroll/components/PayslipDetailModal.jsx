import React, { useState } from 'react';
import { Download, FileText, User, Building2, Calendar, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { payslipsApi } from '@/api/payslips.api';
import { toast } from '@/components/ui/Toast';

export function PayslipDetailModal({ isOpen, onClose, payslip }) {
  const [downloading, setDownloading] = useState(false);

  if (!payslip) return null;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await payslipsApi.downloadPdf(payslip.id, `Payslip-${payslip.reference || 'salary'}.pdf`);
      toast.success('Payslip downloaded successfully');
    } catch {
      toast.error('Failed to download payslip PDF');
    } finally {
      setDownloading(false);
    }
  };

  const lines = payslip.lines || [];
  const currency = payslip.currency || 'INR';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payslip: ${payslip.reference || ''}`}
      description={`Pay period ${payslip.periodLabel || ''} &bull; ${payslip.employee?.fullName || 'Employee'}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={Download}
            isLoading={downloading}
            onClick={handleDownloadPdf}
          >
            Download PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Employee & Payrun Header */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <div className="text-[10px] text-slate-400">Employee</div>
            <div className="font-semibold text-slate-800">{payslip.employee?.fullName}</div>
            <div className="font-mono text-[10px] text-slate-500">{payslip.employee?.employeeCode}</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">Department</div>
            <div className="font-semibold text-slate-800">{payslip.employee?.department?.name || '—'}</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">Worked Days</div>
            <div className="font-semibold text-slate-800">{payslip.workedDays ? String(payslip.workedDays) : '30'} days</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400">Status</div>
            <StatusPill status={payslip.status} size="xs" />
          </div>
        </div>

        {/* Totals Banner */}
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] text-brand-700 uppercase font-semibold tracking-wider">Gross Pay</div>
            <div className="text-base font-bold text-slate-900">
              {formatCurrency(payslip.grossAmount, currency)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-brand-700 uppercase font-semibold tracking-wider">Net Salary Payable</div>
            <div className="text-xl font-bold text-brand-900">
              {formatCurrency(payslip.netAmount, currency)}
            </div>
          </div>
        </div>

        {/* Itemized Lines */}
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          <div className="bg-slate-100/70 px-3 py-2 text-slate-700 font-semibold flex justify-between">
            <span>Item / Earnings &amp; Deductions</span>
            <span>Amount</span>
          </div>

          {lines.length > 0 ? (
            lines.map((line) => {
              const isDeduction = line.category === 'DEDUCTION';
              return (
                <div
                  key={line.id || line.code}
                  className="px-3 py-2 flex items-center justify-between text-slate-700 hover:bg-slate-50"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{line.label}</span>
                    <span className="font-mono text-[10px] text-slate-400">({line.code})</span>
                    <Badge
                      variant={isDeduction ? 'rose' : line.category === 'BASIC' ? 'brand' : 'slate'}
                      size="xs"
                    >
                      {line.category}
                    </Badge>
                  </div>

                  <span
                    className={`font-semibold ${
                      isDeduction ? 'text-rose-600 font-mono' : 'text-slate-900 font-mono'
                    }`}
                  >
                    {isDeduction ? '-' : ''}
                    {formatCurrency(line.amount, currency)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-slate-400">
              Payrun not yet computed. Click Compute on the payrun processing screen to generate itemized lines.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
