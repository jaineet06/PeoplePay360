import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from '@/api/payroll.api';
import { toast } from '@/components/ui/Toast';

// Salary Structures
export function useSalaryStructures(params = {}) {
  return useQuery({
    queryKey: ['salary-structures', params],
    queryFn: async () => {
      const res = await payrollApi.listStructures(params);
      return res; // { success: true, data: [...], meta }
    },
  });
}

export function useSalaryStructure(id) {
  return useQuery({
    queryKey: ['salary-structure', id],
    queryFn: async () => {
      const res = await payrollApi.getStructure(id);
      return res.data?.salaryStructure;
    },
    enabled: Boolean(id),
  });
}

export function useCreateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => payrollApi.createStructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-salary-structures'] });
      toast.success('Salary structure created');
    },
  });
}

export function useUpdateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.updateStructure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-salary-structures'] });
      toast.success('Salary structure updated');
    },
  });
}

export function useDeleteSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => payrollApi.removeStructure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['lookup-salary-structures'] });
      toast.success('Salary structure deactivated');
    },
  });
}

// Salary Rules
export function useSalaryRules(structureId) {
  return useQuery({
    queryKey: ['salary-rules', structureId],
    queryFn: async () => {
      const res = await payrollApi.listRules(structureId);
      return res.data?.rules || [];
    },
    enabled: Boolean(structureId),
  });
}

export function useCreateSalaryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ structureId, data }) => payrollApi.createRule(structureId, data),
    onSuccess: (_, { structureId }) => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules', structureId] });
      toast.success('Salary rule created');
    },
  });
}

export function useUpdateSalaryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ structureId, ruleId, data }) => payrollApi.updateRule(structureId, ruleId, data),
    onSuccess: (_, { structureId }) => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules', structureId] });
      toast.success('Salary rule updated');
    },
  });
}

export function useDeleteSalaryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ structureId, ruleId }) => payrollApi.removeRule(structureId, ruleId),
    onSuccess: (_, { structureId }) => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules', structureId] });
      toast.success('Salary rule removed');
    },
  });
}

export function useReorderSalaryRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ structureId, rules }) => payrollApi.reorderRules(structureId, rules),
    onSuccess: (_, { structureId }) => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules', structureId] });
      toast.success('Rules sequence updated');
    },
  });
}

export function useSimulateSalary() {
  return useMutation({
    mutationFn: ({ structureId, data }) => payrollApi.simulate(structureId, data),
  });
}

// Payruns
export function usePayruns(params = {}) {
  return useQuery({
    queryKey: ['payruns', params],
    queryFn: async () => {
      const res = await payrollApi.listPayruns(params);
      return res;
    },
  });
}

export function usePayrun(id) {
  return useQuery({
    queryKey: ['payrun', id],
    queryFn: async () => {
      const res = await payrollApi.getPayrun(id);
      return res.data?.payrun;
    },
    enabled: Boolean(id),
  });
}

export function usePreviewPayrun() {
  return useMutation({
    mutationFn: (data) => payrollApi.previewPayrun(data),
  });
}

export function useCreatePayrun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => payrollApi.createPayrun(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      toast.success('Payrun created successfully');
    },
  });
}

export function useComputePayrun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => payrollApi.computePayrun(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      toast.success('Payrun computed successfully');
    },
  });
}

export function useValidatePayrun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => payrollApi.validatePayrun(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      toast.success('Payrun validated');
    },
  });
}

export function useMarkPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.markPaid(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      toast.success('Payrun marked as paid');
    },
  });
}

export function useSendPayslips() {
  return useMutation({
    mutationFn: (id) => payrollApi.sendEmails(id),
  });
}
