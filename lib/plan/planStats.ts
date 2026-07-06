import type { QuarterlyReport, ReportStatus, StrategicPlanTree, Subtask } from "../api/types";

export type QuarterDotStatus = "completed" | "in_progress" | "not_started" | "empty";

export function formatSubtaskCode(taskNumber: number | null, sortOrder: number): string {
  if (taskNumber == null) return String(sortOrder);
  return `${taskNumber}.${sortOrder}`;
}

export function getEnrolledSubtaskIds(
  plan: StrategicPlanTree,
  year: number,
  departmentId: string | null | undefined,
): Set<string> {
  if (!departmentId) return new Set();

  const ids = new Set<string>();
  for (const direction of plan.directions) {
    for (const task of direction.tasks) {
      for (const subtask of task.subtasks) {
        if (subtask.year !== year) continue;
        if (subtask.departments?.some((assignment) => assignment.departmentId === departmentId)) {
          ids.add(subtask.id);
        }
      }
    }
  }
  return ids;
}

export function buildMyReportsMap(reports: QuarterlyReport[]): Map<string, QuarterlyReport> {
  const map = new Map<string, QuarterlyReport>();
  for (const report of reports) {
    map.set(report.subtaskId, report);
  }
  return map;
}

export function getSubtaskProgressPercent(
  subtaskId: string,
  enrolledSubtaskIds: Set<string>,
  myReportsBySubtaskId: Map<string, QuarterlyReport>,
): number {
  if (!enrolledSubtaskIds.has(subtaskId)) return 0;
  return myReportsBySubtaskId.get(subtaskId)?.progress.progressPercent ?? 0;
}

function averageProgress(
  subtaskIds: string[],
  enrolledSubtaskIds: Set<string>,
  myReportsBySubtaskId: Map<string, QuarterlyReport>,
): number {
  const enrolled = subtaskIds.filter((id) => enrolledSubtaskIds.has(id));
  if (enrolled.length === 0) return 0;

  const sum = enrolled.reduce(
    (acc, subtaskId) => acc + getSubtaskProgressPercent(subtaskId, enrolledSubtaskIds, myReportsBySubtaskId),
    0,
  );
  return Math.round(sum / enrolled.length);
}

function formatProgressLabel(percent: number, enrolledCount: number): string {
  if (enrolledCount === 0) return "НЕ ВЫБРАНО";
  if (percent >= 100) return "ЗАВЕРШЕНО";
  if (percent === 0) return "0% ВЫПОЛНЕНО";
  return `${percent}% ВЫПОЛНЕНО`;
}

export function getQuarterStatuses(
  reports: QuarterlyReport[],
  year: number,
  departmentId?: string | null,
): QuarterDotStatus[] {
  const scopedReports = departmentId
    ? reports.filter((report) => report.departmentId === departmentId)
    : reports;

  return [1, 2, 3, 4].map((quarter) => {
    const quarterReports = scopedReports.filter(
      (report) => report.reportingPeriod?.year === year && report.reportingPeriod?.quarter === quarter,
    );
    if (quarterReports.length === 0) return "empty";

    const completed = quarterReports.filter((report) => report.status === "completed").length;
    const hasProgress = quarterReports.some((report) => report.status === "in_progress");

    if (completed === quarterReports.length) return "completed";
    if (hasProgress || completed > 0) return "in_progress";
    return "not_started";
  });
}

export function aggregateSubtaskStatus(reports: QuarterlyReport[]): ReportStatus {
  if (reports.length === 0) return "not_started";
  if (reports.every((report) => report.status === "completed")) return "completed";
  if (reports.some((report) => report.status === "in_progress" || report.status === "completed")) {
    return "in_progress";
  }
  return "not_started";
}

export function computeDirectionStats(
  direction: StrategicPlanTree["directions"][number],
  year: number,
  enrolledSubtaskIds: Set<string>,
  myReportsBySubtaskId: Map<string, QuarterlyReport>,
) {
  const tasksWithSubtasks = direction.tasks
    .map((task) => ({
      task,
      subtasks: task.subtasks.filter((subtask) => subtask.year === year),
    }))
    .filter((entry) => entry.subtasks.length > 0);

  const subtasks = tasksWithSubtasks.flatMap((entry) => entry.subtasks);
  const enrolledInDirection = subtasks.filter((subtask) => enrolledSubtaskIds.has(subtask.id));
  const completionPercent = averageProgress(
    subtasks.map((subtask) => subtask.id),
    enrolledSubtaskIds,
    myReportsBySubtaskId,
  );

  return {
    taskCount: tasksWithSubtasks.length,
    totalSubtasks: subtasks.length,
    enrolledCount: enrolledInDirection.length,
    completionPercent,
    label: formatProgressLabel(completionPercent, enrolledInDirection.length),
  };
}

export function computeTaskStats(
  subtasks: Subtask[],
  enrolledSubtaskIds: Set<string>,
  myReportsBySubtaskId: Map<string, QuarterlyReport>,
) {
  const enrolled = subtasks.filter((subtask) => enrolledSubtaskIds.has(subtask.id));
  const completionPercent = averageProgress(
    subtasks.map((subtask) => subtask.id),
    enrolledSubtaskIds,
    myReportsBySubtaskId,
  );

  return {
    subtaskCount: subtasks.length,
    enrolledCount: enrolled.length,
    completionPercent,
    label: formatProgressLabel(completionPercent, enrolled.length),
  };
}

export function computePlanSummary(
  plan: StrategicPlanTree,
  year: number,
  enrolledSubtaskIds: Set<string>,
  myReportsBySubtaskId: Map<string, QuarterlyReport>,
) {
  const subtasks = plan.directions.flatMap((direction) =>
    direction.tasks.flatMap((task) => task.subtasks.filter((subtask) => subtask.year === year)),
  );

  const enrolled = subtasks.filter((subtask) => enrolledSubtaskIds.has(subtask.id));
  const overallPercent = averageProgress(
    subtasks.map((subtask) => subtask.id),
    enrolledSubtaskIds,
    myReportsBySubtaskId,
  );

  let delayedCount = 0;
  for (const subtask of enrolled) {
    const report = myReportsBySubtaskId.get(subtask.id);
    if (!report || report.status === "not_started") delayedCount += 1;
  }

  return {
    totalSubtasks: enrolled.length,
    overallPercent,
    delayedCount,
    directionCount: plan.directions.length,
  };
}
