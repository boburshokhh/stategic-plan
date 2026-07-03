import { useQuery } from "@tanstack/react-query";
import { plansApi } from "../api/endpoints";

export function useActivePlan() {
  return useQuery({
    queryKey: ["plans", "active"],
    queryFn: plansApi.getActive,
    staleTime: 5 * 60_000,
  });
}
