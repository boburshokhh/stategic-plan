import { AlertTriangle, ClipboardList } from "lucide-react";
import styles from "./PlanSummaryCards.module.css";

interface PlanSummaryCardsProps {
  totalSubtasks: number;
  directionCount: number;
  delayedCount: number;
}

export function PlanSummaryCards({ totalSubtasks, directionCount, delayedCount }: PlanSummaryCardsProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.content}>
          <h5 className={styles.label}>Подзадач отдела</h5>
          <div className={styles.value}>{totalSubtasks}</div>
          <p className={styles.hint}>{directionCount} направлений стратегического плана</p>
        </div>
        <ClipboardList className={styles.watermark} size={120} strokeWidth={1} />
      </div>

      <div className={styles.card}>
        <div className={styles.content}>
          <h5 className={styles.label}>Требуют внимания</h5>
          <div className={styles.valueDanger}>{delayedCount}</div>
          <p className={styles.hint}>Подзадач без сданных отчётов</p>
        </div>
        <AlertTriangle className={[styles.watermark, styles.watermarkDanger].join(" ")} size={120} strokeWidth={1} />
      </div>
    </div>
  );
}
