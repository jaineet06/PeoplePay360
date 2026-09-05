import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateAllocation, useTimeOffTypes } from '../hooks/useTimeOff';
import { useManagersLookup } from '@/features/employees/hooks/useLookups';
import { handleApiError } from '@/utils/handleApiError';

const allocationSchema = z
  .object({
    employeeId: z.string().min(1, 'Employee is required'),
    timeOffTypeId: z.string().min(1, 'Time off type is required'),
    allocatedUnits: z
      .string()
      .min(1, 'Allocated units is required')
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be greater than 0'),
    validFrom: z.string().min(1, 'Valid from date is required'),
    validTo: z.string().min(1, 'Valid to date is required'),
    status: z.enum(['PENDING', 'APPROVED']).default('APPROVED'),
    notes: z.string().trim().optional(),
  })
  .refine((data) => new Date(data.validTo) >= new Date(data.validFrom), {
    message: 'Valid To must be on or after Valid From',
    path: ['validTo'],
  });

export function TimeOffAllocationModal({
  isOpen,
  onClose,
  defaultEmployeeId = null,
}) {
  const createMutation = useCreateAllocation();
  const { data: typesData } = useTimeOffTypes();
  const { data: employeesData } = useManagersLookup();

  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      employeeId: defaultEmployeeId || '',
      timeOffTypeId: '',
      allocatedUnits: '18',
      validFrom: `${currentYear}-01-01`,
      validTo: `${currentYear}-12-31`,
      status: 'APPROVED',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        employeeId: defaultEmployeeId || '',
        timeOffTypeId: typesData?.data?.[0]?.id || '',
        allocatedUnits: '18',
        validFrom: `${currentYear}-01-01`,
        validTo: `${currentYear}-12-31`,
        status: 'APPROVED',
        notes: `Annual quota for FY${currentYear}`,
      });
    }
  }, [isOpen, defaultEmployeeId, typesData, reset, currentYear]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      allocatedUnits: Number(values.allocatedUnits),
    };

    try {
      await createMutation.mutateAsync(payload);
      onClose();
    } catch (err) {
      handleApiError(err, setError, 'Failed to assign allocation');
    }
  };

  const isLoading = createMutation.isPending || isSubmitting;

  const employeeOptions = (employeesData || []).map((e) => ({
    value: e.id,
    label: `${e.fullName} (${e.employeeCode})`,
  }));

  const typeOptions = (typesData?.data || []).map((t) => ({
    value: t.id,
    label: `${t.name} (${t.unit})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grant Leave Allocation"
      description="Assign quota or credit leave days to an employee"
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
            Grant Allocation
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Employee"
            placeholder="Select employee..."
            options={employeeOptions}
            disabled={Boolean(defaultEmployeeId)}
            error={errors.employeeId?.message}
            required
            {...register('employeeId')}
          />

          <Select
            label="Time Off Type"
            placeholder="Select type..."
            options={typeOptions}
            error={errors.timeOffTypeId?.message}
            required
            {...register('timeOffTypeId')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Allocated Units"
            placeholder="e.g. 18"
            error={errors.allocatedUnits?.message}
            required
            {...register('allocatedUnits')}
          />

          <Input
            type="date"
            label="Valid From"
            error={errors.validFrom?.message}
            required
            {...register('validFrom')}
          />

          <Input
            type="date"
            label="Valid To"
            error={errors.validTo?.message}
            required
            {...register('validTo')}
          />
        </div>

        <Select
          label="Initial Status"
          options={[
            { value: 'APPROVED', label: 'APPROVED (Active immediately)' },
            { value: 'PENDING', label: 'PENDING (Requires review)' },
          ]}
          error={errors.status?.message}
          {...register('status')}
        />

        <Input
          label="Allocation Notes"
          placeholder="e.g. FY2026 Annual Leave Quota"
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}
