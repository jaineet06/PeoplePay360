import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateSalaryStructure, useUpdateSalaryStructure } from '../hooks/usePayroll';
import { handleApiError } from '@/utils/handleApiError';

const structureSchema = z.object({
  code: z.string().trim().min(2, 'Code is required').max(32).regex(/^[A-Z0-9_]+$/i, 'Alphanumeric & underscore only'),
  name: z.string().trim().min(2, 'Name is required').max(120),
  currency: z.string().length(3).default('INR'),
  netRuleCode: z.string().trim().default('NET'),
});

export function SalaryStructureModal({ isOpen, onClose, structure = null }) {
  const isEditing = Boolean(structure);
  const createMutation = useCreateSalaryStructure();
  const updateMutation = useUpdateSalaryStructure();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(structureSchema),
    defaultValues: {
      code: '',
      name: '',
      currency: 'INR',
      netRuleCode: 'NET',
    },
  });

  useEffect(() => {
    if (structure) {
      reset({
        code: structure.code || '',
        name: structure.name || '',
        currency: structure.currency || 'INR',
        netRuleCode: structure.netRuleCode || 'NET',
      });
    } else {
      reset({
        code: '',
        name: '',
        currency: 'INR',
        netRuleCode: 'NET',
      });
    }
  }, [structure, reset, isOpen]);

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: structure.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      handleApiError(err, setError, 'Failed to save salary structure');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Salary Structure' : 'Create Salary Structure'}
      description="Define a container for payroll computation rules"
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
            {isEditing ? 'Save Changes' : 'Create Structure'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Structure Code"
            placeholder="e.g. REGULAR, EXEC, INTERN"
            disabled={isEditing}
            error={errors.code?.message}
            required
            {...register('code')}
          />

          <Input
            label="Structure Name"
            placeholder="e.g. Standard Full-time Salaried"
            error={errors.name?.message}
            required
            {...register('name')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <Input
            label="Net Rule Code"
            placeholder="Code designating net pay rule (e.g. NET)"
            error={errors.netRuleCode?.message}
            {...register('netRuleCode')}
          />
        </div>
      </form>
    </Modal>
  );
}
