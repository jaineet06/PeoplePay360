import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useUpdateAttendance } from '../hooks/useAttendance';
import { handleApiError } from '@/utils/handleApiError';
import { formatDate } from '@/utils/formatters';

const correctionSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  statusOverride: z.string().optional(),
  correctionReason: z.string().trim().min(3, 'Correction reason is required (min 3 characters)'),
  notes: z.string().trim().optional(),
});

export function AttendanceCorrectionModal({ isOpen, onClose, attendance = null }) {
  const updateMutation = useUpdateAttendance();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(correctionSchema),
    defaultValues: {
      checkIn: '',
      checkOut: '',
      statusOverride: '',
      correctionReason: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (attendance) {
      // Format ISO strings to local datetime-local format YYYY-MM-DDTHH:mm
      const formatToDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      };

      reset({
        checkIn: formatToDateTimeLocal(attendance.checkIn),
        checkOut: formatToDateTimeLocal(attendance.checkOut),
        statusOverride: attendance.status || '',
        correctionReason: attendance.correctionReason || '',
        notes: attendance.notes || '',
      });
    }
  }, [attendance, reset, isOpen]);

  const onSubmit = async (values) => {
    if (!attendance) return;
    try {
      const payload = {
        checkIn: values.checkIn ? new Date(values.checkIn).toISOString() : null,
        checkOut: values.checkOut ? new Date(values.checkOut).toISOString() : null,
        statusOverride: values.statusOverride ? values.statusOverride : undefined,
        correctionReason: values.correctionReason,
        notes: values.notes || null,
      };
      await updateMutation.mutateAsync({ id: attendance.id, data: payload });
      onClose();
    } catch (err) {
      handleApiError(err, setError, 'Failed to save correction');
    }
  };

  const isLoading = updateMutation.isPending || isSubmitting;

  const statusOptions = [
    { value: '', label: 'System Automatic Classification' },
    { value: 'PRESENT', label: 'PRESENT' },
    { value: 'LATE', label: 'LATE' },
    { value: 'OVERTIME', label: 'OVERTIME' },
    { value: 'HALF_DAY', label: 'HALF DAY' },
    { value: 'MISSING_CHECKOUT', label: 'MISSING CHECKOUT' },
    { value: 'ABSENT', label: 'ABSENT' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Attendance Correction"
      description={`Adjust time punches for ${attendance?.employee?.fullName || 'Employee'} on ${formatDate(attendance?.date)}`}
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
            Apply Correction
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="datetime-local"
            label="Check-In Time"
            error={errors.checkIn?.message}
            {...register('checkIn')}
          />

          <Input
            type="datetime-local"
            label="Check-Out Time"
            error={errors.checkOut?.message}
            {...register('checkOut')}
          />
        </div>

        <Select
          label="Status Override"
          helper="Optionally override automatic system classification"
          options={statusOptions}
          error={errors.statusOverride?.message}
          {...register('statusOverride')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Correction Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            placeholder="Document reason for adjustment (e.g., biometric sync error, forgot badge, approved client visit)..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            {...register('correctionReason')}
          />
          {errors.correctionReason && (
            <p className="text-[11px] text-rose-600">{errors.correctionReason.message}</p>
          )}
        </div>

        <Input
          label="Additional Operational Notes"
          placeholder="Optional notes..."
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}
