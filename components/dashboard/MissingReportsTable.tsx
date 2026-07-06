import type { DashboardMissingReport } from "../../lib/api/types";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { CheckCircle2 } from "lucide-react";
import { formatQuarterYear } from "../../lib/format";
import styles from "./MissingReportsTable.module.css";

interface MissingReportsTableProps {
  items: DashboardMissingReport[];
  quarter: number;
  year: number;
}

export function MissingReportsTable({ items, quarter, year }: MissingReportsTableProps) {
  return (
    <section>
      <div className={styles.sectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Не поданные отчёты</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-body)", marginTop: 2 }}>
            {formatQuarterYear(quarter, year)}
          </p>
        </div>
        {items.length > 0 && <Badge variant="danger" pill>{items.length}</Badge>}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Все отделы сдали отчёты"
          description="Пропусков по выбранному кварталу не обнаружено."
        />
      ) : (
        <div className={styles.card} style={{ overflow: "hidden" }}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Направление</th>
                  <th>Задача</th>
                  <th>Подзадача</th>
                  <th>Отдел</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 10).map((item) => (
                  <tr key={`${item.subtaskId}-${item.departmentId}`} className={styles.rowDanger}>
                    <td>{item.directionName}</td>
                    <td>{item.taskTitle}</td>
                    <td>{item.subtaskTitle}</td>
                    <td>{item.departmentName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
