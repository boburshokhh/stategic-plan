import type { QuarterlyReport, StrategicPlanTree, Subtask, SubtaskDepartmentRole } from "../api/types";

export type QuarterDotStatus = "completed" | "in_progress" | "not_started" | "empty";

export interface EnrollmentBreakdown {
  participantIds: Set<string>;
  ownerIds: Set<string>;
  allIds: Set<string>;
}

export function formatSubtaskCode(taskNumber: number | null, sortOrder: number): string {
  if (taskNumber == null) return String(sortOrder);
  return `${taskNumber}.${sortOrder}`;
}

function getDepartmentRole(subtask: Subtask, departmentId: string): SubtaskDepartmentRole | null {
  return subtask.departments?.find((assignment) => assignment.departmentId === departmentId)?.role ?? null;
}

export function getEnrollmentBreakdown(
  plan: StrategicPlanTree,
  year: number,
  departmentId: string | null | undefined,
): EnrollmentBreakdown {
  const participantIds = new Set<string>();
  const ownerIds = new Set<string>();

  if (!departmentId) {
    return { participantIds, ownerIds, allIds: new Set() };
  }

  for (const direction of plan.directions) {
    for (const task of direction.tasks) {
      for (const subtask of task.subtasks) {
        if (subtask.year !== year) continue;
        const role = getDepartmentRole(subtask, departmentId);
        if (role === "participant") participantIds.add(subtask.id);
        if (role === "owner") ownerIds.add(subtask.id);
      }
    }
  }

  return { participantIds, ownerIds, allIds: new Set([...participantIds, ...ownerIds]) };
}

export function getEnrolledSubtaskIds(
  plan: StrategicPlanTree,
  year: number,
  departmentId: string | null | undefined,
): Set<string> {
  return getEnrollmentBreakdown(plan, year, departmentId).allIds;
}

export function buildMyReportsMap(reports: QuarterlyReport[]): Map<string, QuarterlyReport> {
  const map = new Map<string, QuarterlyReport>();
  for (const report of reports) {
    map.set(report.subtaskId, report);
  }
  return map;
}

function formatParticipationLabel(
  participantCount: number,
  ownerCount: number,
  totalCount: number,
): string {
  const enrolledCount = participantCount + ownerCount;
  if (enrolledCount === 0) return "НЕ УЧАСТВУЕМ";

  const parts: string[] = [];
  if (participantCount > 0) {
    parts.push(`${participantCount} ${participantCount === 1 ? "ВЫБРАНА" : "ВЫБРАНО"}`);
  }
  if (ownerCount > 0) {
    parts.push(`${ownerCount} ${ownerCount === 1 ? "НАЗНАЧЕНА" : "НАЗНАЧЕНО"}`);
  }

  const summary = parts.join(" • ");
  if (enrolledCount === totalCount) return summary;
  return `${summary} ИЗ ${totalCount}`;
}

function countRolesInSubtasks(subtasks: Subtask[], departmentId: string | null | undefined) {
  let participantCount = 0;
  let ownerCount = 0;

  if (!departmentId) {
    return { participantCount, ownerCount };
  }

  for (const subtask of subtasks) {
    const role = getDepartmentRole(subtask, departmentId);
    if (role === "participant") participantCount += 1;
    if (role === "owner") ownerCount += 1;
  }

  return { participantCount, ownerCount };
}

export function computeDirectionStats(
  direction: StrategicPlanTree["directions"][number],
  year: number,
  departmentId: string | null | undefined,
) {
  const tasksWithSubtasks = direction.tasks
    .map((task) => ({
      task,
      subtasks: task.subtasks.filter((subtask) => subtask.year === year),
    }))
    .filter((entry) => entry.subtasks.length > 0);

  const subtasks = tasksWithSubtasks.flatMap((entry) => entry.subtasks);
  const { participantCount, ownerCount } = countRolesInSubtasks(subtasks, departmentId);

  return {
    taskCount: tasksWithSubtasks.length,
    totalSubtasks: subtasks.length,
    enrolledCount: participantCount + ownerCount,
    participantCount,
    ownerCount,
    label: formatParticipationLabel(participantCount, ownerCount, subtasks.length),
  };
}

export function computeTaskStats(subtasks: Subtask[], departmentId: string | null | undefined) {
  const { participantCount, ownerCount } = countRolesInSubtasks(subtasks, departmentId);

  return {
    subtaskCount: subtasks.length,
    enrolledCount: participantCount + ownerCount,
    participantCount,
    ownerCount,
    label: formatParticipationLabel(participantCount, ownerCount, subtasks.length),
  };
}

export function computePlanSummary(
  plan: StrategicPlanTree,
  year: number,
  departmentId: string | null | undefined,
) {
  const subtasks = plan.directions.flatMap((direction) =>
    direction.tasks.flatMap((task) => task.subtasks.filter((subtask) => subtask.year === year)),
  );

  const { participantCount, ownerCount } = countRolesInSubtasks(subtasks, departmentId);

  return {
    participantCount,
    ownerCount,
    totalSubtasks: participantCount + ownerCount,
    directionCount: plan.directions.length,
  };
}
