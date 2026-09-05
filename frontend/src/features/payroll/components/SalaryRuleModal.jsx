import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateSalaryRule, useUpdateSalaryRule } from '../hooks/usePayroll';
import { handleApiError } from '@/utils/handleApiError';

const ruleSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(32).regex(/^[A-Z0-9_]+$/i, 'Alphanumeric & underscore only'),
  name: z.string().trim().min(1, 'Name is required').max(120),
  category: z.enum(['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET']),
  sequence: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Sequence must be positive integer'),
  computationMethod: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
  useContractWage: z.boolean().default(false),
  amount: z.string().optional(),
  percentage: z.string().optional(),
  percentageOfCode: z.string().optional(),
  formula: z.string().optional(),
});

export function SalaryRuleModal({
  isOpen,
  onClose,
  structureId,
  rule = null,
  existingRulesCount = 0,
}) {
  const isEditing = Boolean(rule);
  const createMutation = useCreateSalaryRule();
  const updateMutation = useUpdateSalaryRule();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      code: '',
      name: '',
      category: 'ALLOWANCE',
      sequence: String((existingRulesCount + 1) * 10),
      computationMethod: 'FIXED',
      useContractWage: false,
      amount: '',
      percentage: '',
      percentageOfCode: '',
      formula: '',
    },
  });

  const method = watch('computationMethod');
  const useWage = watch('useContractWage');

  useEffect(() => {
    if (rule) {
      reset({
        code: rule.code || '',
        name: rule.name || '',
        category: rule.category || 'ALLOWANCE',
        sequence: String(rule.sequence || 10),
        computationMethod: rule.computationMethod || 'FIXED',
        useContractWage: Boolean(rule.useContractWage),
        amount: rule.amount ? String(rule.amount) : '',
        percentage: rule.percentage ? String(rule.percentage) : '',
        percentageOfCode: rule.percentageOfCode || '',
        formula: rule.formula || '',
      });
    } else {
      reset({
        code: '',
        name: '',
        category: 'ALLOWANCE',
        sequence: String((existingRulesCount + 1) * 10),
        computationMethod: 'FIXED',
        useContractWage: false,
        amount: '',
        percentage: '',
        percentageOfCode: '',
        formula: '',
      });
    }
  }, [rule, existingRulesCount, reset, isOpen]);

  const onSubmit = async (values) => {
    const payload = {
      code: values.code,
      name: values.name,
      category: values.category,
      sequence: Number(values.sequence),
      computationMethod: values.computationMethod,
      useContractWage: values.useContractWage,
      amount: values.amount ? Number(values.amount) : undefined,
      percentage: values.percentage ? Number(values.percentage) : undefined,
      percentageOfCode: values.percentageOfCode || undefined,
      formula: values.formula || undefined,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          structureId,
          ruleId: rule.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync({
          structureId,
          data: payload,
        });
      }
      onClose();
    } catch (err) {
      handleApiError(err, setError, 'Failed to save salary rule');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Salary Rule' : 'Create Salary Rule'}
      description="Define formula, percentage, or fixed component of salary"
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
            {isEditing ? 'Save Changes' : 'Create Rule'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Rule Code"
            placeholder="e.g. BASIC, HRA, PF"
            disabled={isEditing}
            error={errors.code?.message}
            required
            {...register('code')}
          />

          <Input
            label="Rule Label / Name"
            placeholder="e.g. House Rent Allowance"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          <Input
            label="Sequence"
            placeholder="e.g. 10, 20, 30"
            error={errors.sequence?.message}
            required
            {...register('sequence')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Rule Category"
            options={[
              { value: 'BASIC', label: 'BASIC' },
              { value: 'ALLOWANCE', label: 'ALLOWANCE' },
              { value: 'GROSS', label: 'GROSS' },
              { value: 'DEDUCTION', label: 'DEDUCTION' },
              { value: 'NET', label: 'NET' },
            ]}
            error={errors.category?.message}
            required
            {...register('category')}
          />

          <Select
            label="Computation Method"
            options={[
              { value: 'FIXED', label: 'Fixed Amount or Contract Wage' },
              { value: 'PERCENTAGE', label: 'Percentage of Another Rule' },
              { value: 'FORMULA', label: 'Mathematical Formula Expression' },
            ]}
            error={errors.computationMethod?.message}
            required
            {...register('computationMethod')}
          />
        </div>

        {/* Method specific fields */}
        {method === 'FIXED' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                {...register('useContractWage')}
              />
              <span className="text-slate-800 font-medium">
                Use Employee's Active Contract Wage directly
              </span>
            </label>

            {!useWage && (
              <Input
                label="Fixed Amount"
                placeholder="e.g. 15000"
                error={errors.amount?.message}
                {...register('amount')}
              />
            )}
          </div>
        )}

        {method === 'PERCENTAGE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <Input
              label="Percentage (%)"
              placeholder="e.g. 40"
              error={errors.percentage?.message}
              required
              {...register('percentage')}
            />

            <Input
              label="Percentage of Rule Code"
              placeholder="e.g. BASIC"
              error={errors.percentageOfCode?.message}
              required
              {...register('percentageOfCode')}
            />
          </div>
        )}

        {method === 'FORMULA' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <Input
              label="Formula Expression"
              placeholder="e.g. BASIC + HRA or GROSS - PF"
              helper="Evaluated using rules computed earlier in sequence"
              error={errors.formula?.message}
              required
              {...register('formula')}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
