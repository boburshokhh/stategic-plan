"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { usePageHeader } from "../../../../lib/layout/PageHeaderContext";
import { useReport, useReorderReportItems, useUpdateReport } from "../../../../lib/hooks/useReports";
import { useCanEditReport } from "../../../../lib/hooks/useCanEditReport";
import {
  MIN_COMPLETED_CONTENT_LENGTH,
  MIN_REPORT_ITEMS,
  canMarkReportCompleted,
  completedStatusHint,
  countIncompleteSteps,
  stepsRequirementMessage,
} from "../../../../lib/reports/reportConstraints";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { CompletenessBar } from "../../../../components/ui/CompletenessBar";
import { LoadingSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { ErrorAlert } from "../../../../components/ui/ErrorAlert";
import { Textarea } from "../../../../components/ui/FormField";
import { Button } from "../../../../components/ui/Button";
import { ReportItemCard } from "../../../../components/reports/ReportItemCard";
import { AddReportItemForm } from "../../../../components/reports/AddReportItemForm";
import { AttachmentList } from "../../../../components/reports/AttachmentList";
import { RevisionHistory } from "../../../../components/reports/RevisionHistory";
import { formatDateTime, formatQuarterYear } from "../../../../lib/format";
import type { ReportStatus } from "../../../../lib/api/types";
import { ApiError } from "../../../../lib/api/client";
import { useNotification } from "../../../../lib/notifications/NotificationContext";
import styles from "./page.module.css";

const STATUS_LABELS: Record<ReportStatus, string> = {
  not_started: "Не начато",
  in_progress: "В работе",
  completed: "Выполнено",
};

const STATUS_OPTIONS: Array<{ value: ReportStatus; label: string }> = [
  { value: "not_started", label: "Не начато" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Выполнено" },
];

export default function ReportEditorPage() {
  const params = useParams<{ id: string }>();
  const reportId = params.id;
  const { data: report, isLoading, isError, refetch } = useReport(reportId);
  const { notify } = useNotification();
  const canEdit = useCanEditReport(report);

  const [content, setContent] = useState("");
  const [status, setStatus] = useState<ReportStatus>("not_started");
  const [loadedReportId, setLoadedReportId] = useState<string | null>(null);

  if (report && loadedReportId !== report.id) {
    setLoadedReportId(report.id);
    setContent(report.content);
    setStatus(report.status);
  }

  const breadcrumbs = report
    ? [
        { label: "Мои отчёты", href: "/reports/my" },
        { label: report.subtask?.task?.direction?.name ?? "" },
        { label: report.subtask?.task?.title ?? "" },
      ]
    : [];
  usePageHeader(report?.subtask?.title ?? "Отчёт", breadcrumbs);

  const updateMutation = useUpdateReport(reportId);
  const reorderMutation = useReorderReportItems(reportId);

  const items = [...(report?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const stepsCount = items.length;
  const stepsMet = stepsCount >= MIN_REPORT_ITEMS;
  const incompleteStepsCount = countIncompleteSteps(items);
  const contentLength = content.trim().length;
  const canMarkCompleted = canMarkReportCompleted(items, contentLength);
  const completedHint = completedStatusHint(stepsMet, contentLength, incompleteStepsCount);

  function handleMove(itemId: string, direction: "up" | "down") {
    const index = items.findIndex((item) => item.id === itemId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    reorderMutation.mutate(reordered.map((item) => item.id));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!stepsMet) {
      notify({
        variant: "error",
        title: "Не удалось сохранить",
        message: stepsRequirementMessage(stepsCount),
      });
      return;
    }

    if (status === "completed" && !canMarkCompleted) {
      let message: string;
      if (!stepsMet) {
        message = `Для статуса «Выполнено» необходимо добавить минимум ${MIN_REPORT_ITEMS} шага реализации`;
      } else if (incompleteStepsCount > 0) {
        message = `Для статуса «Выполнено» все шаги должны быть выполнены. Не завершено: ${incompleteStepsCount} из ${stepsCount}`;
      } else {
        message = `Для статуса «Выполнено» описание должно содержать не менее ${MIN_COMPLETED_CONTENT_LENGTH} символов`;
      }
      notify({ variant: "error", title: "Не удалось сохранить", message });
      return;
    }

    updateMutation.mutate(
      { content, status },
      {
        onSuccess: () => {
          notify({
            variant: "success",
            title: "Отчёт сохранён",
            message: `Статус: ${STATUS_LABELS[status]}`,
          });
        },
        onError: (error) => {
          notify({
            variant: "error",
            title: "Не удалось сохранить",
            message: error instanceof ApiError ? error.message : "Произошла ошибка при сохранении отчёта",
          });
        },
      },
    );
  }

  function handleCancel() {
    if (report) {
      setContent(report.content);
      setStatus(report.status);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.overviewCard}>
          <LoadingSkeleton lines={6} height={20} />
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return <ErrorAlert message="Не удалось загрузить отчёт" onRetry={() => refetch()} />;
  }

  const completedSteps = report.progress.completedItems;
  const totalSteps = report.progress.totalItems;

  return (
    <div className={styles.page}>
      <section className={styles.overviewCard}>
        <ErrorAlert
          variant={stepsMet ? "success" : "warning"}
          message={stepsRequirementMessage(stepsCount)}
        />
        {stepsMet && status !== "completed" && !canMarkCompleted && (
          <ErrorAlert
            variant="info"
            message={
              incompleteStepsCount > 0
                ? `Для сдачи отчёта отметьте все шаги как «Выполнено». Не завершено: ${incompleteStepsCount} из ${stepsCount}.`
                : "Все шаги выполнены. Заполните резюме (минимум 10 символов) и выберите статус «Выполнено» для сдачи отчёта."
            }
          />
        )}
        <div className={styles.metaGrid}>
          <div>
            <span className={styles.metaLabel}>Отдел</span>
            <span className={styles.metaValue}>{report.department?.shortName ?? report.department?.name ?? "—"}</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Квартал</span>
            <span className={styles.metaValue}>
              {report.reportingPeriod
                ? formatQuarterYear(report.reportingPeriod.quarter, report.reportingPeriod.year)
                : "—"}
            </span>
          </div>
          <div>
            <span className={styles.metaLabel}>Статус</span>
            <div>
              <StatusBadge status={report.status} />
            </div>
          </div>
          <div>
            <span className={styles.metaLabel}>Сдан</span>
            <span className={styles.metaValue}>{report.submittedAt ? formatDateTime(report.submittedAt) : "—"}</span>
          </div>
        </div>
        <CompletenessBar
          percent={report.progress.progressPercent}
          completed={completedSteps}
          total={totalSteps}
          unitLabel={`${completedSteps}/${totalSteps} Шагов`}
          tone="primary"
        />
      </section>

      <section className={styles.stepsSection}>
        <div className={styles.stepsHeader}>
          <h2 className={styles.stepsTitle}>Этапы выполнения</h2>
          <p className={styles.stepsSubtitle}>Разбейте подзадачу на шаги, чтобы отслеживать прогресс</p>
        </div>
        <div className={styles.itemsList}>
          {items.map((item, index) => (
            <ReportItemCard
              key={item.id}
              reportId={reportId}
              item={item}
              departmentId={report.departmentId}
              canEdit={canEdit}
              canRemove={stepsCount > MIN_REPORT_ITEMS}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onMove={(direction) => handleMove(item.id, direction)}
            />
          ))}
        </div>
        {canEdit && <AddReportItemForm reportId={reportId} />}
      </section>

      <section className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Резюме и статус отчёта</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label className={styles.fieldLabel} htmlFor="executive-summary">
              Общее резюме (Executive Summary)
            </label>
            <Textarea
              id="executive-summary"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={!canEdit}
              rows={5}
              placeholder="Введите краткие итоги работы по данной подзадаче..."
            />
            <p className={styles.fieldHint}>
              Минимум {MIN_COMPLETED_CONTENT_LENGTH} символов и все шаги со статусом «Выполнено».
              {!stepsMet && ` Также требуется не менее ${MIN_REPORT_ITEMS} шагов реализации.`}
            </p>
          </div>

          <div className={styles.statusSection} style={{ marginTop: 16 }}>
            <span className={styles.fieldLabel} style={{ marginBottom: 12, display: "block" }}>
              Итоговый статус отчёта
            </span>
            <div className={styles.statusOptions} role="radiogroup" aria-label="Итоговый статус отчёта">
              {STATUS_OPTIONS.map((option) => {
                const isCompleted = option.value === "completed";
                const disabled = !canEdit || (isCompleted && !canMarkCompleted);
                const isActive = status === option.value;
                return (
                  <label
                    key={option.value}
                    className={[
                      styles.statusOption,
                      isActive ? styles.statusOptionActive : "",
                      disabled ? styles.statusOptionDisabled : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    <input
                      type="radio"
                      name="report_status"
                      className={[styles.statusRadio, isCompleted ? styles.statusRadioSuccess : ""].join(" ").trim()}
                      value={option.value}
                      checked={isActive}
                      disabled={disabled}
                      onChange={() => setStatus(option.value)}
                    />
                    <span>
                      {option.label}
                      {isCompleted && completedHint && !canMarkCompleted ? ` (${completedHint})` : ""}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {canEdit && (
            <div className={styles.formActions}>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Отмена
              </Button>
              <Button type="submit" variant="primary" loading={updateMutation.isPending}>
                Сохранить изменения
              </Button>
            </div>
          )}
        </form>
      </section>

      {(report.attachments?.length ?? 0) > 0 || canEdit ? (
        <section className={styles.attachmentsCard}>
          <h2 className={styles.attachmentsTitle}>Вложения отчёта</h2>
          <AttachmentList reportId={reportId} itemId={null} attachments={report.attachments ?? []} canEdit={canEdit} />
        </section>
      ) : null}

      <RevisionHistory revisions={report.revisions ?? []} />
    </div>
  );
}
