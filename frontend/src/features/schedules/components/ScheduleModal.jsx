import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Trash2,
  Clock,
  CalendarDays,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useCreateSchedule, useUpdateSchedule } from '../hooks/useSchedules';
import { handleApiError } from '@/utils/handleApiError';

const WEEKDAYS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

function minuteToTimeString(min) {
  if (min === undefined || min === null || isNaN(min)) return '09:00';
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function timeStringToMinute(str) {
  if (!str) return 0;
  const [h, m] = str.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

const scheduleLineSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  breakMinutes: z.coerce.number().min(0, 'Min 0').max(720, 'Max 720'),
});

const scheduleSchema = z
  .object({
    name: z.string().trim().min(1, 'Schedule name is required').max(120),
    code: z.string().trim().min(1, 'Schedule code is required').max(32),
    timezone: z.string().trim().min(1).default('Asia/Kolkata'),
    isActive: z.boolean().default(true),
    lines: z.array(scheduleLineSchema).min(1, 'At least one day schedule line is required'),
  })
  .superRefine((data, ctx) => {
    // Validate each line: end after start, break < length
    const linesByDay = new Map();

    data.lines.forEach((line, index) => {
      const startMin = timeStringToMinute(line.startTime);
      const endMin = timeStringToMinute(line.endTime);
      const shiftLength = endMin - startMin;

      if (endMin <= startMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End time must be after start time',
          path: ['lines', index, 'endTime'],
        });
      }

      if (line.breakMinutes >= shiftLength && shiftLength > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Break cannot exceed shift length',
          path: ['lines', index, 'breakMinutes'],
        });
      }

      // Check overlaps
      if (!linesByDay.has(line.dayOfWeek)) {
        linesByDay.set(line.dayOfWeek, []);
      }
      linesByDay.get(line.dayOfWeek).push({ index, startMin, endMin });
    });

    // Check overlaps per day
    linesByDay.forEach((dayShifts, day) => {
      dayShifts.sort((a, b) => a.startMin - b.startMin);
      for (let i = 1; i < dayShifts.length; i++) {
        const prev = dayShifts[i - 1];
        const curr = dayShifts[i];
        if (curr.startMin < prev.endMin) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Overlapping shift lines on ${day}`,
            path: ['lines', curr.index, 'startTime'],
          });
        }
      }
    });
  });

const DEFAULT_STANDARD_LINES = [
  { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
];

export function ScheduleModal({ isOpen, onClose, schedule = null }) {
  const isEditing = Boolean(schedule);
  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule();
  const [generalError, setGeneralError] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: '',
      code: '',
      timezone: 'Asia/Kolkata',
      isActive: true,
      lines: DEFAULT_STANDARD_LINES,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'lines',
  });

  const watchedLines = watch('lines') || [];

  // Live client-side computation of weekly hours & active working days
  const liveStats = useMemo(() => {
    let totalMinutes = 0;
    const workingDaysSet = new Set();

    watchedLines.forEach((l) => {
      const startMin = timeStringToMinute(l.startTime);
      const endMin = timeStringToMinute(l.endTime);
      const breakMin = Number(l.breakMinutes) || 0;
      const netMinutes = Math.max(0, endMin - startMin - breakMin);
      totalMinutes += netMinutes;
      if (l.dayOfWeek) {
        workingDaysSet.add(l.dayOfWeek);
      }
    });

    const hours = (totalMinutes / 60).toFixed(2);
    return {
      hoursPerWeek: hours,
      workingDaysPerWeek: workingDaysSet.size,
    };
  }, [watchedLines]);

  useEffect(() => {
    setGeneralError(null);
    if (schedule) {
      const mappedLines = (schedule.lines || []).map((l) => ({
        dayOfWeek: l.dayOfWeek,
        startTime: minuteToTimeString(l.startMinute),
        endTime: minuteToTimeString(l.endMinute),
        breakMinutes: l.breakMinutes ?? 60,
      }));

      reset({
        name: schedule.name || '',
        code: schedule.code || '',
        timezone: schedule.timezone || 'Asia/Kolkata',
        isActive: schedule.isActive ?? true,
        lines: mappedLines.length > 0 ? mappedLines : DEFAULT_STANDARD_LINES,
      });
    } else {
      reset({
        name: '',
        code: '',
        timezone: 'Asia/Kolkata',
        isActive: true,
        lines: DEFAULT_STANDARD_LINES,
      });
    }
  }, [schedule, isOpen, reset]);

  const handleApplyStandard = () => {
    replace(DEFAULT_STANDARD_LINES);
  };

  const onSubmit = async (formData) => {
    setGeneralError(null);
    const payload = {
      name: formData.name,
      code: formData.code.toUpperCase(),
      timezone: formData.timezone,
      isActive: formData.isActive,
      lines: formData.lines.map((l) => ({
        dayOfWeek: l.dayOfWeek,
        startMinute: timeStringToMinute(l.startTime),
        endMinute: timeStringToMinute(l.endTime),
        breakMinutes: Number(l.breakMinutes) || 0,
      })),
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: schedule.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving working schedule';
      setGeneralError(msg);
      handleApiError(err, setError);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Schedule: ${schedule?.name}` : 'Create Working Schedule'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {generalError && (
          <div className="rounded-lg bg-rose-50 p-3 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Basic Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Schedule Name"
              placeholder="e.g. Standard 40 Hours"
              {...register('name')}
              error={errors.name?.message}
              required
            />
          </div>

          <div>
            <Input
              label="Schedule Code"
              placeholder="e.g. STD40, FLEX40"
              {...register('code')}
              error={errors.code?.message}
              required
              className="uppercase"
            />
          </div>

          <div>
            <Input
              label="Timezone"
              placeholder="e.g. Asia/Kolkata"
              {...register('timezone')}
              error={errors.timezone?.message}
              required
            />
          </div>

          <div className="flex items-center space-x-3 pt-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('isActive')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              <span className="ml-3 text-xs font-medium text-slate-700">
                Active Schedule
              </span>
            </label>
          </div>
        </div>

        {/* Live Preview Metric Banner */}
        <div className="rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/80 p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Live Computed Pattern</span>
                  <Badge variant="primary" size="sm">Client Preview</Badge>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Reconciled automatically by the backend upon save.
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-extrabold text-brand-700">
                  {liveStats.hoursPerWeek} hrs
                </div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Weekly Duration
                </div>
              </div>

              <div className="h-8 w-px bg-brand-200 hidden sm:block" />

              <div className="text-right">
                <div className="text-lg font-extrabold text-slate-800">
                  {liveStats.workingDaysPerWeek} days
                </div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Working Days
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Day Pattern Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-brand-600" />
                <span>Weekly Working Days &amp; Shift Hours</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Define the schedule breakdown per weekday. Shift length accounts for unpaid breaks.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleApplyStandard}
                title="Reset to 5-day 40h standard"
              >
                Reset Mon–Fri Standard
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="xs"
                leftIcon={Plus}
                onClick={() =>
                  append({
                    dayOfWeek: 'MONDAY',
                    startTime: '09:00',
                    endTime: '18:00',
                    breakMinutes: 60,
                  })
                }
              >
                Add Day
              </Button>
            </div>
          </div>

          {errors.lines?.root && (
            <p className="text-xs text-rose-600">{errors.lines.root.message}</p>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {fields.map((fieldItem, index) => {
              const currentLine = watchedLines[index] || {};
              const startMin = timeStringToMinute(currentLine.startTime);
              const endMin = timeStringToMinute(currentLine.endTime);
              const breakMin = Number(currentLine.breakMinutes) || 0;
              const netHours = Math.max(0, (endMin - startMin - breakMin) / 60).toFixed(1);

              return (
                <div
                  key={fieldItem.id}
                  className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/90 flex flex-col md:flex-row md:items-center gap-3 transition-colors hover:bg-slate-100/60"
                >
                  {/* Day of Week */}
                  <div className="w-full md:w-44 shrink-0">
                    <label className="text-[10px] font-semibold uppercase text-slate-500 mb-1 block">
                      Day
                    </label>
                    <Select
                      options={WEEKDAYS}
                      {...register(`lines.${index}.dayOfWeek`)}
                    />
                  </div>

                  {/* Start Time */}
                  <div className="w-full md:w-36">
                    <label className="text-[10px] font-semibold uppercase text-slate-500 mb-1 block">
                      Start Time
                    </label>
                    <input
                      type="time"
                      {...register(`lines.${index}.startTime`)}
                      className="w-full px-2.5 py-1.5 bg-white rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                    {errors.lines?.[index]?.startTime && (
                      <p className="text-[10px] text-rose-600 mt-0.5">
                        {errors.lines[index].startTime.message}
                      </p>
                    )}
                  </div>

                  {/* End Time */}
                  <div className="w-full md:w-36">
                    <label className="text-[10px] font-semibold uppercase text-slate-500 mb-1 block">
                      End Time
                    </label>
                    <input
                      type="time"
                      {...register(`lines.${index}.endTime`)}
                      className="w-full px-2.5 py-1.5 bg-white rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                    {errors.lines?.[index]?.endTime && (
                      <p className="text-[10px] text-rose-600 mt-0.5">
                        {errors.lines[index].endTime.message}
                      </p>
                    )}
                  </div>

                  {/* Break Minutes */}
                  <div className="w-full md:w-32">
                    <label className="text-[10px] font-semibold uppercase text-slate-500 mb-1 block">
                      Break (min)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={720}
                      step={5}
                      {...register(`lines.${index}.breakMinutes`)}
                      className="w-full px-2.5 py-1.5 bg-white rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                    {errors.lines?.[index]?.breakMinutes && (
                      <p className="text-[10px] text-rose-600 mt-0.5">
                        {errors.lines[index].breakMinutes.message}
                      </p>
                    )}
                  </div>

                  {/* Net Row Shift Hours preview */}
                  <div className="shrink-0 text-center px-3 py-1 bg-white rounded border border-slate-200 text-slate-700 text-xs font-semibold">
                    <span>{netHours} hrs</span>
                  </div>

                  {/* Remove Button */}
                  <div className="shrink-0 pt-2 md:pt-4 ml-auto">
                    <button
                      type="button"
                      aria-label={`Remove day ${index + 1}`}
                      disabled={fields.length <= 1}
                      onClick={() => remove(index)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditing ? 'Update Schedule' : 'Save Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
