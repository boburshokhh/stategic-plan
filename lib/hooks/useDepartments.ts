import { useQuery } from "@tanstack/react-query";
import { departmentsApi } from "../api/endpoints";

export function useDepartmentMembers(departmentId?: string | null) {
  return useQuery({
    queryKey: ["departments", departmentId, "members"],
    queryFn: () => departmentsApi.findMembers(departmentId as string),
    enabled: Boolean(departmentId),
  });
}
