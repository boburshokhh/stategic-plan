import type { ReportStatus } from "../api/types";

/** Минимальное число шагов реализации в отчёте. */
export const MIN_REPORT_ITEMS = 2;

/** Минимальная длина резюме для статуса «Выполнено». */
export const MIN_COMPLETED_CONTENT_LENGTH = 10;

type StepLike = { status: ReportStatus };

export function countIncompleteSteps(items: StepLike[]): number {
  return items.filter((item) => item.status !== "completed").length;
}

export function allStepsCompleted(items: StepLike[]): boolean {
  return items.length > 0 && countIncompleteSteps(items) === 0;
}

export function canMarkReportCompleted(items: StepLike[], contentLength: number): boolean {
  return (
    items.length >= MIN_REPORT_ITEMS &&
    allStepsCompleted(items) &&
    contentLength >= MIN_COMPLETED_CONTENT_LENGTH
  );
}

export function stepsRequirementMessage(currentCount: number): string {
  if (currentCount >= MIN_REPORT_ITEMS) {
    return `Добавлено ${currentCount} шагов реализации — требование выполнено (минимум ${MIN_REPORT_ITEMS}).`;
  }
  return `Каждый отчёт должен содержать минимум ${MIN_REPORT_ITEMS} шага реализации. Сейчас добавлено: ${currentCount} из ${MIN_REPORT_ITEMS}.`;
}

/** Подсказка, почему нельзя выбрать статус «Выполнено». */
export function completedStatusHint(
  stepsMet: boolean,
  contentLength: number,
  incompleteStepsCount: number,
): string | undefined {
  if (!stepsMet) {
    return `минимум ${MIN_REPORT_ITEMS} шага`;
  }
  if (incompleteStepsCount > 0) {
    return `выполните все шаги (осталось ${incompleteStepsCount})`;
  }
  if (contentLength < MIN_COMPLETED_CONTENT_LENGTH) {
    const remaining = MIN_COMPLETED_CONTENT_LENGTH - contentLength;
    return `заполните резюме (ещё ${remaining} симв.)`;
  }
  return undefined;
}
