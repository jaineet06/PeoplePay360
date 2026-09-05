import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { handleApiError } from '@/utils/handleApiError';
import { useCreateDepartment, useUpdateDepartment } from '../hooks/useDepartments';

const departmentSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(32),
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(255).optional(),
});

export function DepartmentModal({ isOpen, onClose, department = null }) {
  const isEditing = Boolean(department);
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (department) {
      reset({
        code: department.code || '',
        name: department.name || '',
        description: department.description || '',
      });
    } else {
      reset({
        code: '',
        name: '',
        description: '',
      });
    }
  }, [department, reset, isOpen]);

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: department.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      handleApiError(err, setError, 'Failed to save department');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Department' : 'Create Department'}
      description={isEditing ? 'Update organizational unit details' : 'Add a new organizational department'}
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
            {isEditing ? 'Save Changes' : 'Create Department'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <Input
          label="Department Code"
          placeholder="e.g. ENG, FIN, SALES"
          disabled={isEditing}
          error={errors.code?.message}
          required
          {...register('code')}
        />

        <Input
          label="Department Name"
          placeholder="e.g. Software Engineering"
          error={errors.name?.message}
          required
          {...register('name')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Brief overview of department mandate and responsibilities..."
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
