import { useQuery } from '@tanstack/react-query';
import { lookupsApi } from '@/api/lookups.api';

export function useDepartmentsLookup() {
  return useQuery({
    queryKey: ['lookup-departments'],
    queryFn: async () => {
      const res = await lookupsApi.getDepartments();
      return res.data || [];
    },
    staleTime: 60_000,
  });
}

export function useJobPositionsLookup() {
  return useQuery({
    queryKey: ['lookup-job-positions'],
    queryFn: async () => {
      const res = await lookupsApi.getJobPositions();
      return res.data || [];
    },
    staleTime: 60_000,
  });
}

export function useWorkingSchedulesLookup() {
  return useQuery({
    queryKey: ['lookup-working-schedules'],
    queryFn: async () => {
      const res = await lookupsApi.getWorkingSchedules();
      return res.data || [];
    },
    staleTime: 60_000,
  });
}

export function useManagersLookup() {
  return useQuery({
    queryKey: ['lookup-managers'],
    queryFn: async () => {
      const res = await lookupsApi.getManagers();
      return res.data || [];
    },
    staleTime: 60_000,
  });
}

export function useSalaryStructuresLookup() {
  return useQuery({
    queryKey: ['lookup-salary-structures'],
    queryFn: async () => {
      const res = await lookupsApi.getSalaryStructures();
      return res.data || [];
    },
    staleTime: 60_000,
  });
}

export function useTimeOffTypesLookup() {
  return useQuery({
    queryKey: ['lookup-time-off-types'],
    queryFn: async () => {
      const res = await lookupsApi.getTimeOffTypes();
      return res.data || [];
    },
    staleTime: 60_000,
  });
}

