import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateContract, useUpdateContract } from '../hooks/useContracts';
import { useManagersLookup, useSalaryStructuresLookup } from '@/features/employees/hooks/useLookups';
import { handleApiError } from '@/utils/handleApiError';

const contractSchema = z
  .object({
    employeeId: z.string().min(1, 'Employee is required'),
    salaryStructureId: z.string().min(1, 'Salary structure is required'),
    wage: z
      .string()
      .min(1, 'Wage is required')
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
    wageType: z.enum(['MONTHLY', 'ANNUAL', 'DAILY', 'HOURLY']).default('MONTHLY'),
    currency: z.string().default('INR'),
    status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED']).default('ACTIVE'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional().nullable(),
    departmentNameSnapshot: z.string().optional(),
    jobTitleSnapshot: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      return new Date(data.endDate) >= new Date(data.startDate);
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export function ContractModal({
  isOpen,
  onClose,
  contract = null,
  defaultEmployeeId = null,
}) {
  const isEditing = Boolean(contract);
  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract();

  const { data: employeesData } = useManagersLookup(); // lists all active employees
  const { data: structuresData } = useSalaryStructuresLookup();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      employeeId: defaultEmployeeId || '',
      salaryStructureId: '',
      wage: '',
      wageType: 'MONTHLY',
      currency: 'INR',
      status: 'ACTIVE',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      departmentNameSnapshot: '',
      jobTitleSnapshot: '',
    },
  });

  useEffect(() => {
    if (contract) {
      reset({
        employeeId: contract.employeeId || defaultEmployeeId || '',
        salaryStructureId: contract.salaryStructureId || '',
        wage: String(contract.wage || ''),
        wageType: contract.wageType || 'MONTHLY',
        currency: contract.currency || 'INR',
        status: contract.status || 'ACTIVE',
        startDate: contract.startDate ? contract.startDate.slice(0, 10) : '',
        endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
        departmentNameSnapshot: contract.departmentNameSnapshot || '',
        jobTitleSnapshot: contract.jobTitleSnapshot || '',
      });
    } else {
      reset({
        employeeId: defaultEmployeeId || '',
        salaryStructureId: structuresData?.[0]?.id || '',
        wage: '',
        wageType: 'MONTHLY',
        currency: 'INR',
        status: 'ACTIVE',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        departmentNameSnapshot: '',
        jobTitleSnapshot: '',
      });
    }
  }, [contract, defaultEmployeeId, structuresData, reset, isOpen]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      wage: Number(values.wage),
      endDate: values.endDate ? values.endDate : null,
      departmentNameSnapshot: values.departmentNameSnapshot || null,
      jobTitleSnapshot: values.jobTitleSnapshot || null,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: contract.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      // If 409 conflict (overlapping active contract), surface directly as inline field error
      if (err.response?.status === 409) {
        const conflictMsg = err.response.data?.message || 'Dates overlap with an existing active contract for this employee.';
        setError('startDate', { type: 'manual', message: conflictMsg });
        setError('status', { type: 'manual', message: conflictMsg });
      } else {
        handleApiError(err, setError, 'Failed to save contract');
      }
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const employeeOptions = (employeesData || []).map((e) => ({
    value: e.id,
    label: `${e.fullName} (${e.employeeCode})`,
  }));

  const structureOptions = (structuresData || []).map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Contract' : 'Create Employment Contract'}
      description={isEditing ? `Modify contract terms for ${contract?.employee?.fullName || ''}` : 'Set compensation, salary structure, and contract period'}
      footer={
        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {isEditing ? 'Save Changes' : 'Save Contract'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {errors.startDate?.message && errors.startDate.type === 'manual' && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold">Contract Conflict: </span>
              {errors.startDate.message}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Employee"
            placeholder="Select employee..."
            options={employeeOptions}
            disabled={isEditing || Boolean(defaultEmployeeId)}
            error={errors.employeeId?.message}
            required
            {...register('employeeId')}
          />

          <Select
            label="Salary Structure"
            placeholder="Select structure..."
            options={structureOptions}
            error={errors.salaryStructureId?.message}
            required
            {...register('salaryStructureId')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Base Wage Amount"
            placeholder="e.g. 65000"
            error={errors.wage?.message}
            required
            {...register('wage')}
          />

          <Select
            label="Wage Frequency"
            options={[
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'ANNUAL', label: 'Annual' },
              { value: 'DAILY', label: 'Daily' },
              { value: 'HOURLY', label: 'Hourly' },
            ]}
            error={errors.wageType?.message}
            required
            {...register('wageType')}
          />

          <Select
            label="Currency"
            options={[
              { value: 'INR', label: 'INR (₹)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
            ]}
            error={errors.currency?.message}
            {...register('currency')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            type="date"
            label="Start Date"
            error={errors.startDate?.message}
            required
            {...register('startDate')}
          />

          <Input
            type="date"
            label="End Date (Optional)"
            helper="Leave blank for permanent contract"
            error={errors.endDate?.message}
            {...register('endDate')}
          />

          <Select
            label="Contract Status"
            options={[
              { value: 'ACTIVE', label: 'ACTIVE' },
              { value: 'DRAFT', label: 'DRAFT' },
              { value: 'EXPIRED', label: 'EXPIRED' },
              { value: 'TERMINATED', label: 'TERMINATED' },
            ]}
            error={errors.status?.message}
            {...register('status')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Department Snapshot"
            placeholder="e.g. Finance"
            error={errors.departmentNameSnapshot?.message}
            {...register('departmentNameSnapshot')}
          />

          <Input
            label="Job Title Snapshot"
            placeholder="e.g. Senior Analyst"
            error={errors.jobTitleSnapshot?.message}
            {...register('jobTitleSnapshot')}
          />
        </div>
      </form>
    </Modal>
  );
}
