import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateTimeOffRequest, useTimeOffTypes } from '../hooks/useTimeOff';
import { useManagersLookup } from '@/features/employees/hooks/useLookups';
import { handleApiError } from '@/utils/handleApiError';
import { useAuthStore } from '@/features/auth/authStore';

const requestSchema = z
  .object({
    employeeId: z.string().optional(),
    timeOffTypeId: z.string().min(1, 'Leave type is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    duration: z
      .string()
      .min(1, 'Duration is required')
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Duration must be greater than 0'),
    unit: z.enum(['DAYS', 'HOURS']).default('DAYS'),
    reason: z.string().trim().optional(),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export function TimeOffRequestModal({
  isOpen,
  onClose,
  defaultEmployeeId = null,
}) {
  const user = useAuthStore((state) => state.user);
  const isEmployee = user?.role === 'EMPLOYEE';

  const createMutation = useCreateTimeOffRequest();
  const { data: typesData } = useTimeOffTypes();
  const { data: employeesData } = useManagersLookup();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      employeeId: defaultEmployeeId || '',
      timeOffTypeId: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      duration: '1',
      unit: 'DAYS',
      reason: '',
    },
  });

  const selectedTypeId = watch('timeOffTypeId');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Automatically adjust unit when type selected
  useEffect(() => {
    if (selectedTypeId && typesData?.data) {
      const selectedType = typesData.data.find((t) => t.id === selectedTypeId);
      if (selectedType?.unit) {
        setValue('unit', selectedType.unit);
      }
    }
  }, [selectedTypeId, typesData, setValue]);

  // Auto-calculate rough duration in days
  useEffect(() => {
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e >= s) {
        const diffDays = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
        setValue('duration', String(diffDays));
      }
    }
  }, [startDate, endDate, setValue]);

  useEffect(() => {
    if (isOpen) {
      reset({
        employeeId: defaultEmployeeId || '',
        timeOffTypeId: typesData?.data?.[0]?.id || '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        duration: '1',
        unit: 'DAYS',
        reason: '',
      });
    }
  }, [isOpen, defaultEmployeeId, typesData, reset]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      duration: Number(values.duration),
      employeeId: isEmployee ? undefined : (values.employeeId || undefined),
    };

    try {
      await createMutation.mutateAsync(payload);
      onClose();
    } catch (err) {
      handleApiError(err, setError, 'Failed to submit time off request');
    }
  };

  const isLoading = createMutation.isPending || isSubmitting;

  const typeOptions = (typesData?.data || []).map((t) => ({
    value: t.id,
    label: `${t.name} (${t.unit})`,
  }));

  const employeeOptions = (employeesData || []).map((e) => ({
    value: e.id,
    label: `${e.fullName} (${e.employeeCode})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Time Off"
      description="Submit a leave application for approval"
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
            Submit Request
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {!isEmployee && !defaultEmployeeId && (
          <Select
            label="Employee"
            placeholder="Select employee..."
            options={employeeOptions}
            error={errors.employeeId?.message}
            required
            {...register('employeeId')}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Time Off Type"
            placeholder="Select leave type..."
            options={typeOptions}
            error={errors.timeOffTypeId?.message}
            required
            {...register('timeOffTypeId')}
          />

          <Select
            label="Unit"
            options={[
              { value: 'DAYS', label: 'Days' },
              { value: 'HOURS', label: 'Hours' },
            ]}
            error={errors.unit?.message}
            {...register('unit')}
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
            label="End Date"
            error={errors.endDate?.message}
            required
            {...register('endDate')}
          />

          <Input
            label="Duration"
            error={errors.duration?.message}
            required
            {...register('duration')}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Reason / Notes
          </label>
          <textarea
            rows={2}
            placeholder="Describe reason for leave (optional)..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            {...register('reason')}
          />
        </div>
      </form>
    </Modal>
  );
}
