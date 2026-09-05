import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeOffApi } from '@/api/timeOff.api';
import { toast } from '@/components/ui/Toast';

// Types
export function useTimeOffTypes(params = {}) {
  return useQuery({
    queryKey: ['time-off-types', params],
    queryFn: async () => {
      const res = await timeOffApi.listTypes(params);
      return res;
    },
  });
}

export function useCreateTimeOffType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => timeOffApi.createType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-types'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-time-off-types'] });
      toast.success('Time off type created successfully');
    },
  });
}

export function useUpdateTimeOffType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => timeOffApi.updateType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-types'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-time-off-types'] });
      toast.success('Time off type updated successfully');
    },
  });
}

export function useDeleteTimeOffType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => timeOffApi.removeType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-types'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-time-off-types'] });
      toast.success('Time off type deactivated');
    },
  });
}

// Allocations
export function useTimeOffAllocations(params = {}) {
  return useQuery({
    queryKey: ['time-off-allocations', params],
    queryFn: async () => {
      const res = await timeOffApi.listAllocations(params);
      return res;
    },
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => timeOffApi.createAllocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      toast.success('Allocation created successfully');
    },
  });
}

export function useApproveAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => timeOffApi.approveAllocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      toast.success('Allocation approved');
    },
  });
}

export function useRefuseAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => timeOffApi.refuseAllocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      toast.success('Allocation refused');
    },
  });
}

// Requests
export function useTimeOffRequests(params = {}) {
  return useQuery({
    queryKey: ['time-off-requests', params],
    queryFn: async () => {
      const res = await timeOffApi.listRequests(params);
      return res;
    },
  });
}

export function useCreateTimeOffRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => timeOffApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      toast.success('Time off request submitted');
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => timeOffApi.approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      toast.success('Time off request approved');
    },
  });
}

export function useRefuseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => timeOffApi.refuseRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      toast.success('Time off request refused');
    },
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => timeOffApi.cancelRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      toast.success('Time off request cancelled');
    },
  });
}
