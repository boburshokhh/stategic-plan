"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Pencil, Plus } from "lucide-react";
import type { QuarterlyReport, ReportStatus, Subtask } from "../../lib/api/types";
import { formatSubtaskCode } from "../../lib/plan/planStats";
import { reportsApi } from "../../lib/api/endpoints";
import { ApiError } from "../../lib/api/client";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import { CompletenessBar } from "../ui/CompletenessBar";
import styles from "./SubtaskRow.module.css";

interface SubtaskRowProps {
  subtask: Subtask;
  taskNumber: number | null;
  myReport?: QuarterlyReport;
  isEnrolled: boolean;
  periodId?: string;
  canSelect: boolean;
  isParticipating?: boolean;
  onParticipate: () => void;
  onReportEnsured?: () => void;
}

export function SubtaskRow({
  subtask,
  taskNumber,
  myReport,
  isEnrolled,
  periodId,
  canSelect,
  isParticipating,
  onParticipate,
  onReportEnsured,
}: SubtaskRowProps) {
  const router = useRouter();
  const [ensuring, setEnsuring] = useState(false);
  const [ensureError, setEnsureError] = useState<string | null>(null);

  const code = formatSubtaskCode(taskNumber, subtask.sortOrder);
  const progressPercent = myReport?.progress.progressPercent ?? 0;
  const reportStatus: ReportStatus = myReport?.status ?? "not_started";
  const isComplete = progressPercent >= 100 || reportStatus === "completed";

  const handleOpenReport = async () => {
    if (myReport) {
      router.push(`/reports/${myReport.id}`);
      return;
    }
    if (!periodId) {
      setEnsureError("Выберите отчётный квартал в верхней панели.");
      return;
    }

    setEnsureError(null);
    setEnsuring(true);
    try {
      const report = await reportsApi.ensureMy(subtask.id, periodId);
      onReportEnsured?.();
      router.push(`/reports/${report.id}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Не удалось открыть отчёт";
      setEnsureError(message);
    } finally {
      setEnsuring(false);
    }
  };

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <div className={styles.titleLine}>
          <span className={styles.code}>{code}</span>
          <span className={styles.title}>{subtask.title}</span>
        </div>
        {subtask.expectedResult && <span className={styles.expectedResult}>{subtask.expectedResult}</span>}
        {ensureError && <span className={styles.error}>{ensureError}</span>}
      </div>

      <div className={styles.side}>
        {isEnrolled && (
          <div className={styles.status}>
            <StatusBadge status={reportStatus} />
            <div className={styles.progress}>
              <CompletenessBar
                percent={progressPercent}
                completed={myReport?.progress.completedItems}
                total={myReport?.progress.totalItems}
              />
            </div>
          </div>
        )}

        {canSelect && (
          <div className={styles.actions}>
            {isEnrolled ? (
              <Button
                variant={isComplete ? "outline" : "primary"}
                size="small"
                loading={ensuring}
                onClick={handleOpenReport}
              >
                {isComplete ? (
                  <Pencil size={14} strokeWidth={1.75} />
                ) : (
                  <PenLine size={14} strokeWidth={1.75} />
                )}
                {isComplete ? "Изменить отчёт" : "Написать отчёт"}
              </Button>
            ) : (
              <Button variant="outline" size="small" loading={isParticipating} onClick={onParticipate}>
                <Plus size={14} strokeWidth={1.75} />
                Выбрать
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
