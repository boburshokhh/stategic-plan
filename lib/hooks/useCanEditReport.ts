import { useAuth } from "../auth/AuthContext";
import type { QuarterlyReport } from "../api/types";

/** dept_user редактирует только отчёты своего отдела; admin — без ограничений. */
export function useCanEditReport(report?: QuarterlyReport | null) {
  const { user } = useAuth();
  if (!report || !user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "dept_user") return false;
  return report.departmentId === user.departmentId;
}
