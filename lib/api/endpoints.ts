import { api } from "./client";
import type {
  AuthUser,
  Department,
  DepartmentMember,
  LoginResponse,
  QuarterlyReport,
  ReportingPeriod,
  ReportItem,
  ReportItemAssignee,
  ReportStatus,
  StrategicPlanTree,
  ImportStatus,
  ImportSummary,
} from "./types";

export const authApi = {
  login: (email: string, password: string) => api.post<LoginResponse>("/auth/login", { email, password }),
  me: () => api.get<AuthUser>("/auth/me"),
};

export const reportsApi = {
  findMy: (periodId?: string) => api.get<QuarterlyReport[]>(`/reports/my${periodId ? `?periodId=${periodId}` : ""}`),
  findBySubtask: (subtaskId: string, periodId?: string) =>
    api.get<QuarterlyReport[]>(`/reports/by-subtask/${subtaskId}${periodId ? `?periodId=${periodId}` : ""}`),
  findOne: (id: string) => api.get<QuarterlyReport>(`/reports/${id}`),
  update: (id: string, dto: { content: string; status: ReportStatus }) =>
    api.patch<QuarterlyReport>(`/reports/${id}`, dto),
  review: (id: string) => api.post<QuarterlyReport>(`/reports/${id}/review`),

  createItem: (reportId: string, dto: { title: string; content?: string; status?: ReportStatus }) =>
    api.post<ReportItem>(`/reports/${reportId}/items`, dto),
  updateItem: (
    reportId: string,
    itemId: string,
    dto: Partial<{ title: string; content: string; status: ReportStatus }>,
  ) => api.patch<ReportItem>(`/reports/${reportId}/items/${itemId}`, dto),
  removeItem: (reportId: string, itemId: string) =>
    api.delete<{ removed: boolean }>(`/reports/${reportId}/items/${itemId}`),
  reorderItems: (reportId: string, itemIds: string[]) =>
    api.put<ReportItem[]>(`/reports/${reportId}/items/reorder`, { itemIds }),
  assignItemMembers: (
    reportId: string,
    itemId: string,
    assignees: Array<{ userId?: string; externalName?: string }>,
  ) => api.put<ReportItemAssignee[]>(`/reports/${reportId}/items/${itemId}/assignees`, { assignees }),

  uploadAttachment: async (reportId: string, itemId: string | null, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const path = itemId ? `/reports/${reportId}/items/${itemId}/attachments` : `/reports/${reportId}/attachments`;
    return api.post(path, form);
  },
  removeAttachment: (reportId: string, attachmentId: string) =>
    api.delete<{ removed: boolean }>(`/reports/${reportId}/attachments/${attachmentId}`),
};

export const periodsApi = {
  findAll: (year?: number) => api.get<ReportingPeriod[]>(`/reporting-periods${year ? `?year=${year}` : ""}`),
  findCurrent: () => api.get<ReportingPeriod | null>("/reporting-periods/current"),
};

export const plansApi = {
  getActive: () => api.get<StrategicPlanTree>("/plans/active"),
};

export const departmentsApi = {
  findAll: () => api.get<Department[]>("/departments"),
  findMembers: (id: string) => api.get<DepartmentMember[]>(`/departments/${id}/members`),
};

export const importApi = {
  getStatus: () => api.get<ImportStatus>("/import/status"),
  uploadExcel: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ImportSummary>("/import/excel", form);
  },
};
