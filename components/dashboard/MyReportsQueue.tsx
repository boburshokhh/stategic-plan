import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { QuarterlyReport } from "../../lib/api/types";
import { StatusBadge } from "../ui/StatusBadge";
import { CompletenessBar } from "../ui/CompletenessBar";
import { EmptyState } from "../ui/EmptyState";
import { ClipboardList } from "lucide-react";
import { sortReports } from "../reports/MyReportsTable";
import { formatQuarterYear } from "../../lib/format";
import styles from "./MyReportsQueue.module.css";

interface MyReportsQueueProps {
  reports: QuarterlyReport[];
  quarter: number;
  year: number;
  compact?: boolean;
}

export function MyReportsQueue({ reports, quarter, year, compact = false }: MyReportsQueueProps) {
  const sorted = sortReports(reports);
  const displayReports = compact ? sorted.slice(0, 6) : sorted;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Мои активные отчёты</h2>
          <p className={styles.subtitle}>
            {formatQuarterYear(quarter, year)} · {reports.length} {reports.length === 1 ? "задача" : "задач"}
          </p>
        </div>
        <Link href="/reports/my" className={styles.link}>
          Все отчёты <ArrowRight size={14} />
        </Link>
      </div>

      {displayReports.length === 0 ? (
        <div className={styles.emptyWrap}>
          <EmptyState
            icon={ClipboardList}
            title="Отчётов пока нет"
            description="Отчёты появятся, когда будут назначены подзадачи вашему отделу."
          />
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Направление</th>
                <th>Задача / подзадача</th>
                <th>Прогресс</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {displayReports.map((report) => (
                <tr key={report.id}>
                  <td className={styles.primaryCell}>{report.subtask?.task?.direction?.name}</td>
                  <td>
                    <div className={styles.primaryCell}>{report.subtask?.title}</div>
                    <div className={styles.secondaryLine}>{report.subtask?.task?.title}</div>
                  </td>
                  <td className={styles.progressCell}>
                    <CompletenessBar
                      percent={report.progress.progressPercent}
                      completed={report.progress.completedItems}
                      total={report.progress.totalItems}
                    />
                  </td>
                  <td>
                    <StatusBadge status={report.status} />
                  </td>
                  <td>
                    <Link href={`/reports/${report.id}`} className={styles.actionLink}>
                      Открыть <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
