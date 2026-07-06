import { AlertTriangle, ClipboardList } from "lucide-react";
import styles from "./PlanSummaryCards.module.css";

interface PlanSummaryCardsProps {
  participantCount: number;
  ownerCount: number;
  directionCount: number;
  delayedCount: number;
}

export function PlanSummaryCards({
  participantCount,
  ownerCount,
  directionCount,
  delayedCount,
}: PlanSummaryCardsProps) {
  const participationHint =
    ownerCount > 0
      ? `+ ${ownerCount} ${ownerCount === 1 ? "назначена" : "назначено"} ответственным из плана`
      : `${directionCount} направлений стратегического плана`;

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.content}>
          <h5 className={styles.label}>Выбрано подзадач</h5>
          <div className={styles.value}>{participantCount}</div>
          <p className={styles.hint}>{participationHint}</p>
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
