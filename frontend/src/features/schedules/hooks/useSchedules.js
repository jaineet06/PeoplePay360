import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { schedulesApi } from '@/api/schedules.api';

export function useSchedules(params = {}) {
  return useQuery({
    queryKey: ['schedules', params],
    queryFn: async () => {
      const res = await schedulesApi.list(params);
      return res; // { success: true, data: [...], meta }
    },
    staleTime: 30_000,
  });
}

export function useSchedule(id) {
  return useQuery({
    queryKey: ['schedule', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await schedulesApi.getById(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => schedulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-working-schedules'] });
      toast.success('Working schedule created successfully');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to create working schedule';
      toast.error(msg);
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => schedulesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', id] });
      queryClient.invalidateQueries({ queryKey: ['lookup-working-schedules'] });
      toast.success('Working schedule updated successfully');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to update working schedule';
      toast.error(msg);
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => schedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-working-schedules'] });
      toast.success('Working schedule deactivated');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to deactivate working schedule';
      toast.error(msg);
    },
  });
}
