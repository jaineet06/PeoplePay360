import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { handleApiError } from '@/utils/handleApiError';
import { useCreateJobPosition, useUpdateJobPosition } from '../hooks/useDepartments';

const positionSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(32),
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z.string().trim().max(255).optional(),
});

export function JobPositionModal({ isOpen, onClose, position = null }) {
  const isEditing = Boolean(position);
  const createMutation = useCreateJobPosition();
  const updateMutation = useUpdateJobPosition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      code: '',
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    if (position) {
      reset({
        code: position.code || '',
        title: position.title || '',
        description: position.description || '',
      });
    } else {
      reset({
        code: '',
        title: '',
        description: '',
      });
    }
  }, [position, reset, isOpen]);

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: position.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      handleApiError(err, setError, 'Failed to save job position');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Job Position' : 'Create Job Position'}
      description={isEditing ? 'Update job role and title' : 'Define a new job role in the organization'}
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
            {isEditing ? 'Save Changes' : 'Create Position'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <Input
          label="Position Code"
          placeholder="e.g. SR_BE_ENG, PM, HR_SPEC"
          disabled={isEditing}
          error={errors.code?.message}
          required
          {...register('code')}
        />

        <Input
          label="Job Title"
          placeholder="e.g. Senior Backend Engineer"
          error={errors.title?.message}
          required
          {...register('title')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Key responsibilities and qualifications..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-[11px] text-rose-600">{errors.description.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
