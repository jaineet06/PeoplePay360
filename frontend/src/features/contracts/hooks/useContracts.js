import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '@/api/contracts.api';
import { toast } from '@/components/ui/Toast';

export function useContracts(params = {}) {
  return useQuery({
    queryKey: ['contracts', params],
    queryFn: async () => {
      const res = await contractsApi.list(params);
      return res; // { success: true, data: [...], meta }
    },
  });
}

export function useContract(id) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const res = await contractsApi.getById(id);
      return res.data?.contract;
    },
    enabled: Boolean(id),
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => contractsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      toast.success('Contract created successfully');
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => contractsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      toast.success('Contract updated successfully');
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => contractsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      toast.success('Contract cancelled successfully');
    },
  });
}
