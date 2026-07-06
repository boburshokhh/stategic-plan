import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsApi } from "../api/endpoints";

export function useMySubtaskParticipation(year: number) {
  return useQuery({
    queryKey: ["departments", "me", "subtasks", year],
    queryFn: () => departmentsApi.getMySubtasks(year),
  });
}

function useInvalidateParticipation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["departments", "me", "subtasks"] });
    queryClient.invalidateQueries({ queryKey: ["plans", "active"] });
    queryClient.invalidateQueries({ queryKey: ["reports", "my"] });
  };
}

export function useParticipateInSubtasks() {
  const invalidate = useInvalidateParticipation();
  return useMutation({
    mutationFn: (subtaskIds: string[]) => departmentsApi.participate(subtaskIds),
    onSuccess: invalidate,
  });
}

export function useUnparticipateFromSubtask() {
  const invalidate = useInvalidateParticipation();
  return useMutation({
    mutationFn: (subtaskId: string) => departmentsApi.unparticipate(subtaskId),
    onSuccess: invalidate,
  });
}
