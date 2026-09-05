import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateTimeOffType, useUpdateTimeOffType } from '../hooks/useTimeOff';
import { handleApiError } from '@/utils/handleApiError';

const typeSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(32),
  name: z.string().trim().min(1, 'Name is required').max(120),
  unit: z.enum(['DAYS', 'HOURS']).default('DAYS'),
  requiresAllocation: z.boolean().default(true),
  approvalRequired: z.boolean().default(true),
  affectsPayroll: z.boolean().default(false),
  isPaid: z.boolean().default(true),
});

export function TimeOffTypeModal({ isOpen, onClose, type = null }) {
  const isEditing = Boolean(type);
  const createMutation = useCreateTimeOffType();
  const updateMutation = useUpdateTimeOffType();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      code: '',
      name: '',
      unit: 'DAYS',
      requiresAllocation: true,
      approvalRequired: true,
      affectsPayroll: false,
      isPaid: true,
    },
  });

  useEffect(() => {
    if (type) {
      reset({
        code: type.code || '',
        name: type.name || '',
        unit: type.unit || 'DAYS',
        requiresAllocation: type.requiresAllocation ?? true,
        approvalRequired: type.approvalRequired ?? true,
        affectsPayroll: type.affectsPayroll ?? false,
        isPaid: type.isPaid ?? true,
      });
    } else {
      reset({
        code: '',
        name: '',
        unit: 'DAYS',
        requiresAllocation: true,
        approvalRequired: true,
        affectsPayroll: false,
        isPaid: true,
      });
    }
  }, [type, reset, isOpen]);

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: type.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      handleApiError(err, setError, 'Failed to save time off type');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Time Off Type' : 'Create Time Off Type'}
      description="Configure leave classification and approval requirements"
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
            {isEditing ? 'Save Changes' : 'Create Type'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Type Code"
            placeholder="e.g. PL, SL, MATERNITY"
            disabled={isEditing}
            error={errors.code?.message}
            required
            {...register('code')}
          />

          <Input
            label="Type Name"
            placeholder="e.g. Paid Annual Leave"
            error={errors.name?.message}
            required
            {...register('name')}
          />
        </div>

        <Select
          label="Unit of Measurement"
          options={[
            { value: 'DAYS', label: 'Days' },
            { value: 'HOURS', label: 'Hours' },
          ]}
          error={errors.unit?.message}
          {...register('unit')}
        />

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <div className="font-semibold text-slate-800">Policy Rules &amp; Flags</div>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              {...register('requiresAllocation')}
            />
            <span className="text-slate-700 font-medium">Requires Quota Allocation (Balance tracked)</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              {...register('approvalRequired')}
            />
            <span className="text-slate-700 font-medium">Manager Approval Required</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              {...register('isPaid')}
            />
            <span className="text-slate-700 font-medium">Paid Leave (Compensation maintained)</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              {...register('affectsPayroll')}
            />
            <span className="text-slate-700 font-medium">Affects Payroll (Deducted from unpaid days)</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}
