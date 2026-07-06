/** Минимальное число шагов реализации в отчёте. */
export const MIN_REPORT_ITEMS = 2;

/** Минимальная длина резюме для статуса «Выполнено». */
export const MIN_COMPLETED_CONTENT_LENGTH = 10;

export function stepsRequirementMessage(currentCount: number): string {
  if (currentCount >= MIN_REPORT_ITEMS) {
    return `Добавлено ${currentCount} шагов реализации — требование выполнено (минимум ${MIN_REPORT_ITEMS}).`;
  }
  return `Каждый отчёт должен содержать минимум ${MIN_REPORT_ITEMS} шага реализации. Сейчас добавлено: ${currentCount} из ${MIN_REPORT_ITEMS}.`;
}
