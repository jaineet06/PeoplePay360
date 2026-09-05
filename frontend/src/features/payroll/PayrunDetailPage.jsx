import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  CreditCard,
  Mail,
  Download,
  AlertTriangle,
  Users,
  FileSpreadsheet,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  usePayrun,
  useComputePayrun,
  useValidatePayrun,
  useMarkPaid,
  useSendPayslips,
} from './hooks/usePayroll';
import { PayslipDetailModal } from './components/PayslipDetailModal';
import { SendSummaryModal } from './components/SendSummaryModal';
import { payslipsApi } from '@/api/payslips.api';
import { toast } from '@/components/ui/Toast';

export function PayrunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: payrun, isLoading, error } = usePayrun(id);

  const computeMutation = useComputePayrun();
  const validateMutation = useValidatePayrun();
  const markPaidMutation = useMarkPaid();
  const sendMutation = useSendPayslips();

  // Modals & results
  const [warnings, setWarnings] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [paymentDateModalOpen, setPaymentDateModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [sendReport, setSendReport] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading payrun batch details...
      </div>
    );
  }

  if (error || !payrun) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Payrun Not Found</h3>
        <Button
          variant="outline"
          size="sm"
          leftIcon={ArrowLeft}
          className="mt-4"
          onClick={() => navigate('/payroll')}
        >
          Back to Payroll Hub
        </Button>
      </div>
    );
  }

  const currency = payrun.currency || 'INR';

  // State flags for lifecycle actions
  const isDraft = payrun.status === 'DRAFT';
  const isComputed = payrun.status === 'COMPUTED';
  const isValidated = payrun.status === 'VALIDATED';
  const isPaid = payrun.status === 'PAID';

  const canCompute = isDraft || isComputed;
  const canValidate = isComputed;
  const canMarkPaid = isValidated;
  const canSend = isValidated || isPaid;

  const handleCompute = async () => {
    try {
      const res = await computeMutation.mutateAsync(payrun.id);
      if (res.data?.warnings?.length > 0) {
        setWarnings(res.data.warnings);
      } else {
        setWarnings([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to compute payrun');
    }
  };

  const handleValidate = async () => {
    try {
      await validateMutation.mutateAsync(payrun.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to validate payrun');
    }
  };

  const handleConfirmMarkPaid = async () => {
    try {
      await markPaidMutation.mutateAsync({
        id: payrun.id,
        data: { paymentDate },
      });
      setPaymentDateModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark payrun as paid');
    }
  };

  const handleSendPayslips = async () => {
    try {
      const res = await sendMutation.mutateAsync(payrun.id);
      setSendReport(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send payslips');
    }
  };

  const handleDownloadPdf = async (payslip) => {
    setDownloadingId(payslip.id);
    try {
      await payslipsApi.downloadPdf(payslip.id, `Payslip-${payslip.reference}.pdf`);
      toast.success('Payslip downloaded');
    } catch {
      toast.error('Failed to download payslip PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const payslipColumns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (ref) => <span className="font-mono font-semibold text-slate-800">{ref}</span>,
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.employee?.fullName}</div>
          <div className="font-mono text-[11px] text-slate-400">{row.employee?.employeeCode}</div>
        </div>
      ),
    },
    {
      key: 'grossAmount',
      header: 'Gross Pay',
      render: (g) => (
        <span className="font-semibold text-slate-800 font-mono">
          {formatCurrency(g, currency)}
        </span>
      ),
    },
    {
      key: 'netAmount',
      header: 'Net Payable',
      render: (n) => (
        <span className="font-bold text-slate-900 font-mono">
          {formatCurrency(n, currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (st) => <StatusPill status={st} size="xs" />,
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
            leftIcon={Eye}
            onClick={() => setSelectedPayslip(row)}
          >
            View Lines
          </Button>

          <Button
            variant="outline"
            size="xs"
            leftIcon={Download}
            isLoading={downloadingId === row.id}
            onClick={() => handleDownloadPdf(row)}
          >
            PDF
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Nav */}
      <button
        type="button"
        onClick={() => navigate('/payroll')}
        className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Payruns List
      </button>

      {/* Main Processing Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {payrun.name}
              </h1>
              <StatusPill status={payrun.status} size="sm" />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {payrun.reference}
              </span>
              <span>
                Period: {formatDate(payrun.periodStart)} &rarr; {formatDate(payrun.periodEnd)} ({payrun.periodLabel})
              </span>
              <span>
                Structure: <strong>{payrun.salaryStructure?.name}</strong>
              </span>
            </div>
          </div>

          {/* Action Workflow Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canCompute && (
              <Button
                variant={isDraft ? 'primary' : 'outline'}
                size="sm"
                leftIcon={Calculator}
                isLoading={computeMutation.isPending}
                onClick={handleCompute}
              >
                {isComputed ? 'Recompute All' : 'Compute Payrun'}
              </Button>
            )}

            {canValidate && (
              <Button
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                leftIcon={CheckCircle2}
                isLoading={validateMutation.isPending}
                onClick={handleValidate}
              >
                Validate Payrun
              </Button>
            )}

            {canMarkPaid && (
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                leftIcon={CreditCard}
                onClick={() => setPaymentDateModalOpen(true)}
              >
                Mark Paid
              </Button>
            )}

            {canSend && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={Mail}
                isLoading={sendMutation.isPending}
                onClick={handleSendPayslips}
              >
                Dispatch Payslip Emails
              </Button>
            )}
          </div>
        </div>

        {/* Financial Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Employees in Run</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {payrun.employeeCount || payrun.payslips?.length || 0}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Gross</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
              {formatCurrency(payrun.totalGross, currency)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Deductions</div>
            <div className="text-xl font-bold text-rose-600 mt-0.5 font-mono">
              {formatCurrency(payrun.totalDeductions, currency)}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="text-[10px] text-emerald-800 font-semibold uppercase">Total Net Disbursement</div>
            <div className="text-xl font-bold text-emerald-950 mt-0.5 font-mono">
              {formatCurrency(payrun.totalNet, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Warnings Banner returned from compute */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Operational Warnings from Compute Engine ({warnings.length})</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
            {warnings.map((w, idx) => (
              <div
                key={idx}
                className="p-2 bg-white/80 rounded-lg border border-amber-200/80 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-800">{w.employeeCode}: </span>
                  <span className="text-amber-900">{w.message}</span>
                </div>
                <Badge variant="amber" size="xs">{w.type}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payslips Table */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">
          Payslips in Batch ({payrun.payslips?.length || 0})
        </h3>

        <DataTable
          columns={payslipColumns}
          data={payrun.payslips || []}
          emptyTitle="No payslips generated"
          emptyDescription="Compute payrun to populate itemized payslips."
        />
      </div>

      {/* Modals */}
      <PayslipDetailModal
        isOpen={Boolean(selectedPayslip)}
        onClose={() => setSelectedPayslip(null)}
        payslip={selectedPayslip}
      />

      <SendSummaryModal
        isOpen={Boolean(sendReport)}
        onClose={() => setSendReport(null)}
        summary={sendReport}
      />

      {/* Payment Date Confirmation Modal */}
      <Modal
        isOpen={paymentDateModalOpen}
        onClose={() => setPaymentDateModalOpen(false)}
        title="Mark Payrun as Paid"
        description="Confirm disbursement date for financial records"
        footer={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setPaymentDateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={markPaidMutation.isPending}
              onClick={handleConfirmMarkPaid}
            >
              Confirm Disbursement
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <Input
            type="date"
            label="Payment Date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Marking this payrun as paid will transition all {payrun.payslips?.length || 0} associated payslips to PAID status and record the payment timestamp.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default PayrunDetailPage;
