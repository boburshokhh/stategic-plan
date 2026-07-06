import Link from "next/link";
import { ArrowRight, ChevronRight, FilePenLine } from "lucide-react";
import type { QuarterlyReport } from "../../lib/api/types";
import { formatQuarterYear } from "../../lib/format";
import { iconSize } from "../../lib/icons";
import { StatusBadge } from "../ui/StatusBadge";
import { CompletenessBar } from "../ui/CompletenessBar";
import tableStyles from "../ui/Table.module.css";
import styles from "./MyReportsTable.module.css";

const STATUS_ORDER: Record<QuarterlyReport["status"], number> = {
  not_started: 0,
  in_progress: 1,
  completed: 2,
};

export function sortReports(reports: QuarterlyReport[]) {
  return [...reports].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

export function MyReportsTable({ reports }: { reports: QuarterlyReport[] }) {
  return (
    <table className={tableStyles.table}>
      <thead>
        <tr>
          <th>Подзадача</th>
          <th>Квартал</th>
          <th>Прогресс</th>
          <th>Статус</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {reports.map((report) => (
          <tr key={report.id}>
            <td>
              <div className={tableStyles.primaryCell}>{report.subtask?.title}</div>
              <div className={[tableStyles.secondaryLine, styles.breadcrumb].join(" ")}>
                {report.subtask?.task?.direction?.name}
                <ChevronRight {...iconSize("xs")} className={styles.breadcrumbSep} />
                {report.subtask?.task?.title}
              </div>
            </td>
            <td>
              {report.reportingPeriod
                ? formatQuarterYear(report.reportingPeriod.quarter, report.reportingPeriod.year)
                : "—"}
            </td>
            <td style={{ minWidth: 140 }}>
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
              <Link href={`/reports/${report.id}`} className={styles.openLink}>
                <FilePenLine {...iconSize("sm")} className={styles.openIcon} />
                Открыть
                <ArrowRight {...iconSize("xs")} className={styles.openIcon} />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
