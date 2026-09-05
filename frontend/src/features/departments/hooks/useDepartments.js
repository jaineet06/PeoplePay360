import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, jobPositionsApi } from '@/api/departments.api';
import { toast } from '@/components/ui/Toast';

export function useDepartments(params = {}) {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: async () => {
      const res = await departmentsApi.list(params);
      return res; // { success: true, data: [...], meta: {...} }
    },
  });
}

export function useJobPositions(params = {}) {
  return useQuery({
    queryKey: ['job-positions', params],
    queryFn: async () => {
      const res = await jobPositionsApi.list(params);
      return res;
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => departmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-departments'] });
      toast.success('Department created successfully');
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => departmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-departments'] });
      toast.success('Department updated successfully');
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => departmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-departments'] });
      toast.success('Department deactivated successfully');
    },
  });
}

export function useCreateJobPosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => jobPositionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-positions'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-job-positions'] });
      toast.success('Job position created successfully');
    },
  });
}

export function useUpdateJobPosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => jobPositionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-positions'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-job-positions'] });
      toast.success('Job position updated successfully');
    },
  });
}

export function useDeleteJobPosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => jobPositionsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-positions'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-job-positions'] });
      toast.success('Job position deactivated successfully');
    },
  });
}
