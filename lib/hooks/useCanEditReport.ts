import { useAuth } from "../auth/AuthContext";
import type { QuarterlyReport } from "../api/types";

/**
 * Зеркалит assertCanEditReport на бэкенде (quarterly-reports.service.ts):
 * dept_user может редактировать только свой отчёт и только в окне сбора текущего квартала,
 * admin — без ограничений. Это правило действует и для этапов/вложений, и для итогового текста/статуса.
 */
export function useCanEditReport(report?: QuarterlyReport | null) {
  const { user } = useAuth();
  if (!report || !user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "dept_user") return false;
  if (report.departmentId !== user.departmentId) return false;

  const period = report.reportingPeriod;
  if (!period) return false;
  const now = new Date();
  return now >= new Date(period.collectionStart) && now <= new Date(period.collectionEnd);
}
