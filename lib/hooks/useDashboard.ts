import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/endpoints";

export function useDashboardOverview(year: number, quarter: number, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "overview", year, quarter],
    queryFn: () => dashboardApi.getOverview(year, quarter),
    enabled,
  });
}
