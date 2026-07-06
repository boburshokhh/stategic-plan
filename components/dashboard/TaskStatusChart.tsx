import type { StatusBreakdown } from "../../lib/dashboard/reportStats";
import { STATUS_CHART_ROWS, percentOf } from "../../lib/dashboard/reportStats";
import { formatQuarterYear } from "../../lib/format";
import styles from "./TaskStatusChart.module.css";

interface TaskStatusChartProps {
  breakdown: StatusBreakdown;
  quarter: number;
  year: number;
  emptyHint?: string;
  notStartedLabel?: string;
}

export function TaskStatusChart({
  breakdown,
  quarter,
  year,
  emptyHint,
  notStartedLabel = "Не начато",
}: TaskStatusChartProps) {
  const { total } = breakdown;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Статус задач</h3>
        <p className={styles.subtitle}>
          {formatQuarterYear(quarter, year)} · распределение отчётов по статусам
        </p>
      </div>

      {total === 0 ? (
        <p className={styles.empty}>
          {emptyHint ?? "Нет назначенных подзадач на этот квартал. Выберите задачи в разделе «Стратегический план»."}
        </p>
      ) : (
        <>
          <div className={styles.rows}>
            {STATUS_CHART_ROWS.map((row) => {
              const count = breakdown[row.key];
              const pct = percentOf(count, total);
              const label = row.key === "notStarted" ? notStartedLabel : row.label;
              return (
                <div key={row.key}>
                  <div className={styles.rowHeader}>
                    <span className={styles.rowLabel}>{label}</span>
                    <span className={styles.rowMeta}>
                      <span className={styles.rowCount}>{count}</span> · {pct}%
                    </span>
                  </div>
                  <div className={styles.track}>
                    <div className={styles.fill} style={{ width: `${pct}%`, background: row.colorVar }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.summary}>
            <span>
              Всего: <strong>{total}</strong>
            </span>
            <span>
              Выполнено: <strong>{percentOf(breakdown.completed, total)}%</strong>
            </span>
            <span>
              Не завершено: <strong>{percentOf(breakdown.inProgress + breakdown.notStarted, total)}%</strong>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
