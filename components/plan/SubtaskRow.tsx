"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Pencil, UserPlus } from "lucide-react";
import type { QuarterlyReport, ReportStatus, Subtask, SubtaskDepartmentRole } from "../../lib/api/types";
import { formatSubtaskCode } from "../../lib/plan/planStats";
import { reportsApi } from "../../lib/api/endpoints";
import { ApiError } from "../../lib/api/client";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { StatusBadge } from "../ui/StatusBadge";
import { CompletenessBar } from "../ui/CompletenessBar";
import styles from "./SubtaskRow.module.css";

interface SubtaskRowProps {
  subtask: Subtask;
  taskNumber: number | null;
  departmentId?: string | null;
  canParticipate: boolean;
  myReport?: QuarterlyReport;
  periodId?: string;
  onParticipate?: (subtaskId: string) => Promise<void>;
  participating?: boolean;
  onUnenroll?: (subtaskId: string) => void;
  unenrolling?: boolean;
  onReportEnsured?: () => void;
}

function getDepartmentAssignment(subtask: Subtask, departmentId?: string | null) {
  return subtask.departments?.find((assignment) => assignment.departmentId === departmentId) ?? null;
}

function roleBadge(role: SubtaskDepartmentRole) {
  if (role === "owner") {
    return <Badge variant="primary">Ответственный</Badge>;
  }
  return <Badge variant="secondary">Участник</Badge>;
}

export function SubtaskRow({
  subtask,
  taskNumber,
  departmentId,
  canParticipate,
  myReport,
  periodId,
  onParticipate,
  participating,
  onUnenroll,
  unenrolling,
  onReportEnsured,
}: SubtaskRowProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [participateError, setParticipateError] = useState<string | null>(null);
  const [ensuring, setEnsuring] = useState(false);
  const [ensureError, setEnsureError] = useState<string | null>(null);

  const assignment = getDepartmentAssignment(subtask, departmentId);
  const isOwner = assignment?.role === "owner";
  const isParticipant = assignment?.role === "participant";
  const isEnrolled = Boolean(assignment);
  const canJoin = canParticipate && !isEnrolled && Boolean(onParticipate);
  const canWriteReport = canParticipate && isEnrolled;

  const code = formatSubtaskCode(taskNumber, subtask.sortOrder);
  const progressPercent = myReport?.progress.progressPercent ?? 0;
  const reportStatus: ReportStatus = myReport?.status ?? "not_started";
  const isComplete = reportStatus === "completed";

  const handleConfirmParticipate = async () => {
    if (!onParticipate) return;
    try {
      await onParticipate(subtask.id);
      setConfirmOpen(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Не удалось заявить участие";
      setParticipateError(message);
    }
  };

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
    <>
      <div className={[styles.row, isEnrolled ? styles.rowOwn : ""].join(" ")}>
        <div className={styles.main}>
          <div className={styles.titleLine}>
            <span className={styles.code}>{code}</span>
            <span className={styles.title}>{subtask.title}</span>
          </div>
          {subtask.expectedResult && <span className={styles.expectedResult}>{subtask.expectedResult}</span>}
          {ensureError && <span className={styles.error}>{ensureError}</span>}
        </div>

        <div className={styles.side}>
          <div className={styles.badges}>
            {isOwner && roleBadge("owner")}
            {isParticipant && roleBadge("participant")}
          </div>

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

          <div className={styles.actions}>
            {canJoin && (
              <Button
                type="button"
                variant="outline"
                size="small"
                onClick={() => {
                  setParticipateError(null);
                  setConfirmOpen(true);
                }}
              >
                <UserPlus size={14} strokeWidth={1.75} />
                Участвовать
              </Button>
            )}

            {canWriteReport && (
              <Button
                variant={isComplete ? "outline" : "primary"}
                size="small"
                loading={ensuring}
                onClick={handleOpenReport}
              >
                {isComplete ? <Pencil size={14} strokeWidth={1.75} /> : <PenLine size={14} strokeWidth={1.75} />}
                {isComplete ? "Изменить отчёт" : "Написать отчёт"}
              </Button>
            )}

            {isParticipant && onUnenroll && (
              <Button
                type="button"
                variant="ghost"
                size="small"
                loading={unenrolling}
                onClick={() => onUnenroll(subtask.id)}
              >
                Снять участие
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Подтвердите участие"
        description={
          <>
            Ваш отдел будет участвовать в подзадаче. После подтверждения она появится в разделе «Мои отчёты».
            <div className={styles.modalSubtaskTitle}>{subtask.title}</div>
            {participateError && <div className={styles.error}>{participateError}</div>}
          </>
        }
        confirmLabel="Участвовать"
        loading={participating}
        onConfirm={handleConfirmParticipate}
        onCancel={() => {
          setParticipateError(null);
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
