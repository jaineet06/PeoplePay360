import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleDollarSign, Download, Eye, Calendar } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { usePagination } from '@/hooks/usePagination';
import { useAuthStore } from '@/features/auth/authStore';
import { payslipsApi } from '@/api/payslips.api';
import { PayslipDetailModal } from '@/features/payroll/components/PayslipDetailModal';
import { toast } from '@/components/ui/Toast';

export function MyPayslipsPage() {
  const { page, limit, onPageChange, onLimitChange } = usePagination(1, 10);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const userId = useAuthStore((state) => state.user?.id);

  // Scoped to employee via token
  const { data, isLoading } = useQuery({
    queryKey: ['my-payslips', userId, page, limit],
    queryFn: async () => {
      const res = await payslipsApi.list({
        page,
        limit,
        sortBy: 'periodStart',
        order: 'desc',
      });
      return res;
    },
  });

  const handleDownloadPdf = async (payslip) => {
    setDownloadingId(payslip.id);
    try {
      await payslipsApi.downloadPdf(payslip.id, `Payslip-${payslip.periodLabel || 'salary'}.pdf`);
      toast.success('Payslip downloaded successfully');
    } catch {
      toast.error('Failed to download payslip PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    {
      key: 'periodLabel',
      header: 'Pay Period',
      render: (pl, row) => (
        <div>
          <div className="font-semibold text-slate-900">{pl}</div>
          <div className="text-[10px] text-slate-400">
            {formatDate(row.periodStart)} &rarr; {formatDate(row.periodEnd)}
          </div>
        </div>
      ),
    },
    {
      key: 'reference',
      header: 'Payslip Ref',
      render: (ref) => <span className="font-mono font-semibold text-slate-800">{ref}</span>,
    },
    {
      key: 'grossAmount',
      header: 'Gross Salary',
      render: (g, row) => (
        <span className="font-semibold text-slate-700 font-mono">
          {formatCurrency(g, row.currency || 'INR')}
        </span>
      ),
    },
    {
      key: 'netAmount',
      header: 'Net Take-Home',
      render: (n, row) => (
        <span className="font-bold text-brand-900 font-mono text-sm">
          {formatCurrency(n, row.currency || 'INR')}
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
        <div className="flex items-center justify-end space-x-1.5">
          <Button
            variant="ghost"
            size="xs"
            leftIcon={Eye}
            onClick={() => setSelectedPayslip(row)}
          >
            Breakdown
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
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
          <CircleDollarSign className="h-6 w-6 text-brand-600" />
          My Compensation &amp; Payslips
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your salary disbursement history and download tax/payroll receipts
        </p>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        emptyTitle="No payslips available"
        emptyDescription="Your payslips will appear here once monthly payruns are validated and disbursed."
      />

      <PayslipDetailModal
        isOpen={Boolean(selectedPayslip)}
        onClose={() => setSelectedPayslip(null)}
        payslip={selectedPayslip}
      />
    </div>
  );
}

export default MyPayslipsPage;
