import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendance.api';
import { toast } from '@/components/ui/Toast';

export function useAttendanceList(params = {}) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: async () => {
      const res = await attendanceApi.list(params);
      return res; // { success: true, data: [...], meta }
    },
  });
}

export function useAttendance(id) {
  return useQuery({
    queryKey: ['attendance-record', id],
    queryFn: async () => {
      const res = await attendanceApi.getById(id);
      return res.data?.attendance;
    },
    enabled: Boolean(id),
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance record created');
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => attendanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance correction applied successfully');
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => attendanceApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance record removed');
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceApi.checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Clocked in successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to clock in');
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceApi.checkOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Clocked out successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to clock out');
    },
  });
}
