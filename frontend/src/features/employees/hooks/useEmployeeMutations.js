import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/api/employee.api';
import { toast } from '@/components/ui/Toast';
import { handleApiError } from '@/utils/handleApiError';

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await employeeApi.create(payload);
      return response.data; // { employee, user?, tempPassword?, tempPasswordNote? }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-kanban'] });
      toast.success(
        `Employee "${data.employee.fullName}" (${data.employee.employeeCode}) created successfully.`
      );
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

export function useKanbanStatusUpdate(kanbanParams) {
  const queryClient = useQueryClient();
  const { groupBy, search, departmentId } = kanbanParams;
  const kanbanKey = ['employees-kanban', { groupBy, search, departmentId }];

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await employeeApi.update(id, { status });
      return response.data.employee;
    },
    onMutate: async ({ id, fromStatus, toStatus, destinationIndex }) => {
      await queryClient.cancelQueries({ queryKey: ['employees-kanban'] });
      const previous = queryClient.getQueryData(kanbanKey);
      queryClient.setQueryData(kanbanKey, (old) =>
        moveEmployeeInKanban(old, id, fromStatus, toStatus, destinationIndex)
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(kanbanKey, context.previous);
      }
      toast.error(
        error.response?.data?.message || 'Could not move employee — status change was reverted.'
      );
    },
    onSuccess: (employee) => {
      toast.success(`"${employee.fullName}" moved to ${employee.status.replace(/_/g, ' ').toLowerCase()}.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

function moveEmployeeInKanban(kanbanData, employeeId, fromStatus, toStatus, destinationIndex) {
  if (!kanbanData?.groups) return kanbanData;

  const groups = kanbanData.groups.map((g) => ({
    ...g,
    employees: [...g.employees],
  }));

  const sourceGroup = groups.find((g) => g.key === fromStatus);
  const destGroup = groups.find((g) => g.key === toStatus);
  if (!sourceGroup || !destGroup) return kanbanData;

  const empIndex = sourceGroup.employees.findIndex((e) => e.id === employeeId);
  if (empIndex === -1) return kanbanData;

  const [moved] = sourceGroup.employees.splice(empIndex, 1);
  const updated = { ...moved, status: toStatus };
  destGroup.employees.splice(destinationIndex, 0, updated);
  sourceGroup.count = sourceGroup.employees.length;
  destGroup.count = destGroup.employees.length;

  return { ...kanbanData, groups };
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await employeeApi.update(id, payload);
      return response.data.employee;
    },
    onSuccess: (updatedEmployee) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['employee', updatedEmployee.id] });
      toast.success(`Employee "${updatedEmployee.fullName}" updated successfully.`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await employeeApi.remove(id);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-kanban'] });
      toast.success('Employee record removed successfully.');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}
