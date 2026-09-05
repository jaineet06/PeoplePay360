import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Users,
  Building2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatters';
import { useSalaryStructuresLookup } from '@/features/employees/hooks/useLookups';
import { usePreviewPayrun, useCreatePayrun } from '../hooks/usePayroll';
import { handleApiError } from '@/utils/handleApiError';

const step1Schema = z
  .object({
    name: z.string().trim().min(2, 'Name is required').max(120),
    salaryStructureId: z.string().min(1, 'Salary structure is required'),
    periodStart: z.string().min(1, 'Period start date is required'),
    periodEnd: z.string().min(1, 'Period end date is required'),
  })
  .refine((data) => new Date(data.periodEnd) >= new Date(data.periodStart), {
    message: 'Period end date must be on or after period start date',
    path: ['periodEnd'],
  });

export function PayrunWizardModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [previewData, setPreviewData] = useState(null); // { eligible, skipped, salaryStructureId, periodStart, periodEnd }
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [step1Values, setStep1Values] = useState(null);

  const { data: structuresData } = useSalaryStructuresLookup();
  const previewMutation = usePreviewPayrun();
  const createMutation = useCreatePayrun();

  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: `${new Date().toLocaleString('default', { month: 'long' })} ${currentYear} Payrun`,
      salaryStructureId: '',
      periodStart: `${currentYear}-${currentMonth}-01`,
      periodEnd: `${currentYear}-${currentMonth}-28`,
    },
  });

  const handleStep1Submit = async (values) => {
    try {
      setStep1Values(values);
      const res = await previewMutation.mutateAsync({
        salaryStructureId: values.salaryStructureId,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
      });

      const data = res.data;
      setPreviewData(data);
      // Default select all eligible employees
      const allEligibleIds = (data.eligible || []).map((e) => e.employeeId);
      setSelectedEmployeeIds(allEligibleIds);
      setStep(2);
    } catch (err) {
      handleApiError(err, setError, 'Failed to resolve payrun preview');
    }
  };

  const handleCreatePayrun = async () => {
    if (selectedEmployeeIds.length === 0) {
      alert('Please select at least one employee for this payrun.');
      return;
    }

    try {
      const payload = {
        name: step1Values.name,
        salaryStructureId: step1Values.salaryStructureId,
        periodStart: step1Values.periodStart,
        periodEnd: step1Values.periodEnd,
        employeeIds: selectedEmployeeIds,
      };

      const res = await createMutation.mutateAsync(payload);
      const payrun = res.data?.payrun;
      onClose();
      if (payrun?.id) {
        navigate(`/payroll/payruns/${payrun.id}`);
      }
    } catch (err) {
      handleApiError(err, setError, 'Failed to create payrun');
    }
  };

  const toggleSelectEmployee = (id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!previewData?.eligible) return;
    if (selectedEmployeeIds.length === previewData.eligible.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(previewData.eligible.map((e) => e.employeeId));
    }
  };

  const structureOptions = (structuresData || []).map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code})`,
  }));

  const isStep1Loading = previewMutation.isPending;
  const isStep2Loading = createMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setStep(1);
        setPreviewData(null);
        reset();
        onClose();
      }}
      title={step === 1 ? 'New Payrun — Step 1 of 2' : 'Review Employees — Step 2 of 2'}
      description={
        step === 1
          ? 'Configure payroll period and structure'
          : `Select employees to include in ${step1Values?.name || 'payrun'}`
      }
      footer={
        <div className="flex items-center justify-between w-full">
          {step === 2 ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={ArrowLeft}
              onClick={() => setStep(1)}
              disabled={isStep2Loading}
            >
              Back to Configuration
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isStep1Loading || isStep2Loading}
            >
              Cancel
            </Button>

            {step === 1 ? (
              <Button
                variant="primary"
                size="sm"
                rightIcon={ArrowRight}
                isLoading={isStep1Loading}
                onClick={handleSubmit(handleStep1Submit)}
              >
                Next: Review Employees
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                isLoading={isStep2Loading}
                disabled={selectedEmployeeIds.length === 0}
                onClick={handleCreatePayrun}
              >
                Create Payrun ({selectedEmployeeIds.length})
              </Button>
            )}
          </div>
        </div>
      }
    >
      {step === 1 && (
        <form onSubmit={handleSubmit(handleStep1Submit)} className="space-y-4 text-xs">
          <Input
            label="Payrun Batch Name"
            placeholder="e.g. March 2026 Regular Salary"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          <Select
            label="Salary Structure"
            placeholder="Select salary structure to compute with..."
            options={structureOptions}
            error={errors.salaryStructureId?.message}
            required
            {...register('salaryStructureId')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Pay Period Start"
              error={errors.periodStart?.message}
              required
              {...register('periodStart')}
            />

            <Input
              type="date"
              label="Pay Period End"
              error={errors.periodEnd?.message}
              required
              {...register('periodEnd')}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs leading-relaxed space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-brand-600" />
              Contract &amp; Structure Verification
            </div>
            <p>
              In the next step, the system will resolve all employees having an active contract bound to the selected salary structure for this pay period. Any employees lacking an active contract or with mismatched structures will be surfaced.
            </p>
          </div>
        </form>
      )}

      {step === 2 && previewData && (
        <div className="space-y-4 text-xs">
          {/* Summary Box */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <div className="font-semibold text-slate-900">
                {previewData.eligible?.length || 0} Eligible Personnel Found
              </div>
              <div className="text-[11px] text-slate-500">
                Period: {previewData.periodStart?.slice(0, 10)} to {previewData.periodEnd?.slice(0, 10)}
              </div>
            </div>

            <Button
              variant="outline"
              size="xs"
              onClick={toggleSelectAll}
            >
              {selectedEmployeeIds.length === previewData.eligible?.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>

          {/* Eligible Employees List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {previewData.eligible?.length > 0 ? (
              previewData.eligible.map((item) => {
                const isChecked = selectedEmployeeIds.includes(item.employeeId);
                return (
                  <div
                    key={item.employeeId}
                    onClick={() => toggleSelectEmployee(item.employeeId)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-brand-300 bg-brand-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {item.fullName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {item.employeeCode} &bull; Contract: {item.contractReference}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(item.wage, 'INR')}
                      </div>
                      {!item.hasBankDetails && (
                        <span className="text-[10px] text-amber-600 font-medium">
                          No Bank Details
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-slate-500">
                No employees are eligible for this salary structure in this period.
              </div>
            )}
          </div>

          {/* Skipped Warnings Box */}
          {previewData.skipped?.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-1.5 text-amber-900 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>{previewData.skipped.length} Employees Skipped (Cannot be included)</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto text-[11px]">
                {previewData.skipped.map((s) => (
                  <div
                    key={s.employeeId}
                    className="flex items-start justify-between bg-white/70 p-1.5 rounded border border-amber-200/60"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{s.fullName}</span>{' '}
                      <span className="font-mono text-slate-500">({s.employeeCode})</span>
                      <div className="text-amber-800">{s.message}</div>
                    </div>
                    <Badge variant="amber" size="xs">{s.reason}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
