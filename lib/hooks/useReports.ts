import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "../api/endpoints";
import type { ReportStatus } from "../api/types";

export function useMyReports(periodId?: string) {
  return useQuery({
    queryKey: ["reports", "my", periodId],
    queryFn: () => reportsApi.findMy(periodId),
  });
}

export function useReport(reportId: string) {
  return useQuery({
    queryKey: ["reports", reportId],
    queryFn: () => reportsApi.findOne(reportId),
    enabled: Boolean(reportId),
  });
}

export function useBySubtaskReports(subtaskId: string, periodId?: string) {
  return useQuery({
    queryKey: ["reports", "by-subtask", subtaskId, periodId],
    queryFn: () => reportsApi.findBySubtask(subtaskId, periodId),
    enabled: Boolean(subtaskId),
  });
}

/** Инвалидирует все кэши, связанные с конкретным отчётом, после любой мутации. */
function useInvalidateReport(reportId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["reports", reportId] });
    queryClient.invalidateQueries({ queryKey: ["reports", "my"] });
    queryClient.invalidateQueries({ queryKey: ["reports", "by-subtask"] });
  };
}

export function useUpdateReport(reportId: string) {
  const invalidate = useInvalidateReport(reportId);
  return useMutation({
    mutationFn: (dto: { content: string; status: ReportStatus }) => reportsApi.update(reportId, dto),
    onSuccess: invalidate,
  });
}

export function useCreateReportItem(reportId: string) {
  const invalidate = useInvalidateReport(reportId);
  return useMutation({
    mutationFn: (dto: { title: string; content?: string; status?: ReportStatus }) =>
      reportsApi.createItem(reportId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdateReportItem(reportId: string) {
  const invalidate = useInvalidateReport(reportId);
  return useMutation({
    mutationFn: ({
      itemId,
      dto,
    }: {
      itemId: string;
      dto: Partial<{ title: string; content: string; status: ReportStatus }>;
    }) => reportsApi.updateItem(reportId, itemId, dto),
    onSuccess: invalidate,
  });
}

export function useRemoveReportItem(reportId: string) {
  const invalidate = useInvalidateReport(reportId);
  return useMutation({
    mutationFn: (itemId: string) => reportsApi.removeItem(reportId, itemId),
    onSuccess: invalidate,
  });
}

export function useReorderReportItems(reportId: string) {
  const invalidate = useInvalidateReport(reportId);
  return useMutation({
    mutationFn: (itemIds: string[]) => reportsApi.reorderItems(reportId, itemIds),
    onSuccess: invalidate,
  });
}

export function useAssignItemMembers(reportId: string) {
  const invalidate = useInvalidateReport(reportId);
  return useMutation({
    mutationFn: ({ itemId, assignees }: { itemId: string; assignees: Array<{ userId?: string; externalName?: string }> }) =>
      reportsApi.assignItemMembers(reportId, itemId, assignees),
    onSuccess: invalidate,
  });
}

export function useUploadAttachment(reportId: string) {
  const invalidate = useInvalidateReport(reportId);
  return useMutation({
    mutationFn: ({ itemId, file }: { itemId: string | null; file: File }) =>
      reportsApi.uploadAttachment(reportId, itemId, file),
    onSuccess: invalidate,
  });
}

export function useRemoveAttachment(reportId: string) {
  const invalidate = useInvalidateReport(reportId);
  return useMutation({
    mutationFn: (attachmentId: string) => reportsApi.removeAttachment(reportId, attachmentId),
    onSuccess: invalidate,
  });
}
