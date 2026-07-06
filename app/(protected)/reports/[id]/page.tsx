"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { usePageHeader } from "../../../../lib/layout/PageHeaderContext";
import { useReport, useReorderReportItems, useUpdateReport } from "../../../../lib/hooks/useReports";
import { useCanEditReport } from "../../../../lib/hooks/useCanEditReport";
import { Card } from "../../../../components/ui/Card";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { CompletenessBar } from "../../../../components/ui/CompletenessBar";
import { LoadingSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { ErrorAlert } from "../../../../components/ui/ErrorAlert";
import { Field, Select, Textarea } from "../../../../components/ui/FormField";
import { Button } from "../../../../components/ui/Button";
import { ReportItemCard } from "../../../../components/reports/ReportItemCard";
import { AddReportItemForm } from "../../../../components/reports/AddReportItemForm";
import { AttachmentList } from "../../../../components/reports/AttachmentList";
import { RevisionHistory } from "../../../../components/reports/RevisionHistory";
import { formatDateTime, formatQuarterYear } from "../../../../lib/format";
import type { ReportStatus } from "../../../../lib/api/types";
import { ApiError } from "../../../../lib/api/client";
import styles from "./page.module.css";

const MIN_COMPLETED_CONTENT_LENGTH = 10;

export default function ReportEditorPage() {
  const params = useParams<{ id: string }>();
  const reportId = params.id;
  const { data: report, isLoading, isError, refetch } = useReport(reportId);
  const canEdit = useCanEditReport(report);

  const [content, setContent] = useState("");
  const [status, setStatus] = useState<ReportStatus>("not_started");
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [loadedReportId, setLoadedReportId] = useState<string | null>(null);

  // Подставляем данные отчёта в форму один раз при загрузке (без useEffect, см. react-hooks/set-state-in-effect).
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
    setFormError(null);
    if (status === "completed" && content.trim().length < MIN_COMPLETED_CONTENT_LENGTH) {
      setFormError(`Для статуса «Выполнено» описание должно содержать не менее ${MIN_COMPLETED_CONTENT_LENGTH} символов`);
      return;
    }
    updateMutation.mutate(
      { content, status },
      {
        onSuccess: () => setSavedAt(Date.now()),
        onError: (error) => setFormError(error instanceof ApiError ? error.message : "Не удалось сохранить отчёт"),
      },
    );
  }

  function handleCancel() {
    if (report) {
      setContent(report.content);
      setStatus(report.status);
      setFormError(null);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <LoadingSkeleton lines={6} height={20} />
      </Card>
    );
  }

  if (isError || !report) {
    return <ErrorAlert message="Не удалось загрузить отчёт" onRetry={() => refetch()} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Отдел</span>
            <span className={styles.metaValue}>{report.department?.shortName ?? report.department?.name}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Квартал</span>
            <span className={styles.metaValue}>
              {report.reportingPeriod
                ? formatQuarterYear(report.reportingPeriod.quarter, report.reportingPeriod.year)
                : "—"}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Статус</span>
            <StatusBadge status={report.status} />
          </div>
          {report.submittedAt && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Сдан</span>
              <span className={styles.metaValue}>{formatDateTime(report.submittedAt)}</span>
            </div>
          )}
        </div>
        <CompletenessBar
          percent={report.progress.progressPercent}
          completed={report.progress.completedItems}
          total={report.progress.totalItems}
        />
      </Card>

      <Card title="Этапы выполнения" subtitle="Разбейте подзадачу на шаги, чтобы отслеживать прогресс">
        <div className={styles.itemsList}>
          {items.map((item, index) => (
            <ReportItemCard
              key={item.id}
              reportId={reportId}
              item={item}
              departmentId={report.departmentId}
              canEdit={canEdit}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onMove={(direction) => handleMove(item.id, direction)}
            />
          ))}
        </div>
        {canEdit && <AddReportItemForm reportId={reportId} />}
      </Card>

      <Card title="Итоговое резюме отчёта">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Описание выполненных работ за квартал">
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={!canEdit}
              rows={5}
            />
          </Field>
          <Field label="Статус">
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as ReportStatus)}
              disabled={!canEdit}
              style={{ maxWidth: 240 }}
            >
              <option value="not_started">Не начато</option>
              <option value="in_progress">В работе</option>
              <option value="completed">Выполнено полностью</option>
            </Select>
          </Field>

          {formError && <ErrorAlert message={formError} />}

          {canEdit && (
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" loading={updateMutation.isPending}>
                Сохранить
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Отмена
              </Button>
              {savedAt && (
                <span className={styles.savedHint}>
                  <CheckCircle2 size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                  Сохранено
                </span>
              )}
            </div>
          )}
        </form>
      </Card>

      <Card title="Вложения отчёта">
        <AttachmentList reportId={reportId} itemId={null} attachments={report.attachments ?? []} canEdit={canEdit} />
      </Card>

      <Card flat>
        <RevisionHistory revisions={report.revisions ?? []} />
      </Card>
    </div>
  );
}
