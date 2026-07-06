import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { reportsApi } from "../api/endpoints";
import type { QuarterlyReport } from "../api/types";

/** Загружает все квартальные отчёты по списку подзадач (без фильтра периода). */
export function usePlanSubtaskReportsMap(subtaskIds: string[]) {
  const queries = useQueries({
    queries: subtaskIds.map((subtaskId) => ({
      queryKey: ["reports", "by-subtask", subtaskId, "all-quarters"],
      queryFn: () => reportsApi.findBySubtask(subtaskId),
      staleTime: 60_000,
      enabled: Boolean(subtaskId),
    })),
  });

  const reportsMap = useMemo(() => {
    const map = new Map<string, QuarterlyReport[]>();
    subtaskIds.forEach((subtaskId, index) => {
      const data = queries[index]?.data;
      if (data) map.set(subtaskId, data);
    });
    return map;
  }, [subtaskIds, queries]);

  const isLoading = queries.some((query) => query.isLoading);

  return { reportsMap, isLoading };
}
