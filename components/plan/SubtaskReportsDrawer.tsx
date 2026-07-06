"use client";

import Link from "next/link";
import { X, Inbox } from "lucide-react";
import type { Subtask } from "../../lib/api/types";
import { useBySubtaskReports } from "../../lib/hooks/useReports";
import { usePeriod } from "../../lib/period/PeriodContext";
import { formatQuarterYear } from "../../lib/format";
import { StatusBadge } from "../ui/StatusBadge";
import { CompletenessBar } from "../ui/CompletenessBar";
import { EmptyState } from "../ui/EmptyState";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { Button } from "../ui/Button";
import styles from "./SubtaskReportsDrawer.module.css";

interface SubtaskReportsDrawerProps {
  subtask: Subtask;
  ownDepartmentId?: string | null;
  onClose: () => void;
}

export function SubtaskReportsDrawer({ subtask, ownDepartmentId, onClose }: SubtaskReportsDrawerProps) {
  const { selectedPeriod } = usePeriod();
  const { data: reports, isLoading } = useBySubtaskReports(subtask.id, selectedPeriod?.id);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{subtask.title}</div>
            {subtask.expectedResult && <div className={styles.expectedResult}>{subtask.expectedResult}</div>}
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-body)" }}>
          {selectedPeriod ? formatQuarterYear(selectedPeriod.quarter, selectedPeriod.year) : "Период не выбран"}
        </div>

        {isLoading && <LoadingSkeleton lines={2} height={60} />}

        {!isLoading && (!reports || reports.length === 0) && (
          <EmptyState icon={Inbox} title="Отчётов пока нет" description="Ни один отдел ещё не подал отчёт по этой подзадаче за выбранный квартал." />
        )}

        {!isLoading &&
          reports?.map((report) => (
            <div key={report.id} className={styles.reportCard}>
              <div className={styles.reportHeader}>
                <span className={styles.deptName}>{report.department?.shortName ?? report.department?.name}</span>
                <StatusBadge status={report.status} />
              </div>
              <CompletenessBar
                percent={report.progress.progressPercent}
                completed={report.progress.completedItems}
                total={report.progress.totalItems}
              />
              {report.submittedAt && <span className={styles.reportMeta}>Сдан: {new Date(report.submittedAt).toLocaleDateString("ru-RU")}</span>}
              {report.departmentId === ownDepartmentId && (
                <Link href={`/reports/${report.id}`}>
                  <Button variant="outline" size="small">
                    Заполнить
                  </Button>
                </Link>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
