import type { DashboardOverview, QuarterlyReport, ReportStatus } from "../api/types";

export interface StatusBreakdown {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

export function breakdownFromReports(reports: QuarterlyReport[]): StatusBreakdown {
  const completed = reports.filter((r) => r.status === "completed").length;
  const inProgress = reports.filter((r) => r.status === "in_progress").length;
  const notStarted = reports.filter((r) => r.status === "not_started").length;
  return { total: reports.length, completed, inProgress, notStarted };
}

export function breakdownFromOverview(overview: DashboardOverview): StatusBreakdown {
  const { totals } = overview;
  return {
    total: totals.totalExpected,
    completed: totals.completed,
    inProgress: totals.inProgress,
    notStarted: totals.missingCount,
  };
}

export function completionPercent(breakdown: StatusBreakdown) {
  if (breakdown.total === 0) return 0;
  return Math.round((breakdown.completed / breakdown.total) * 100);
}

export function percentOf(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

export const STATUS_CHART_ROWS: Array<{
  key: keyof Pick<StatusBreakdown, "completed" | "inProgress" | "notStarted">;
  label: string;
  colorVar: string;
}> = [
  { key: "completed", label: "Выполнено", colorVar: "var(--color-success)" },
  { key: "inProgress", label: "В работе", colorVar: "var(--color-warning)" },
  { key: "notStarted", label: "Не начато", colorVar: "var(--color-secondary)" },
];
