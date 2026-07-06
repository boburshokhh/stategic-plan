import type { QuarterDotStatus } from "../../lib/plan/planStats";
import styles from "./QuarterStatusDots.module.css";

interface QuarterStatusDotsProps {
  statuses: QuarterDotStatus[];
}

const STATUS_CLASS: Record<QuarterDotStatus, string> = {
  completed: styles.onTrack,
  in_progress: styles.delayed,
  not_started: styles.pending,
  empty: styles.pending,
};

export function QuarterStatusDots({ statuses }: QuarterStatusDotsProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Статус по кварталам</span>
      <div className={styles.dots}>
        {statuses.map((status, index) => (
          <div
            key={index}
            className={[styles.dot, STATUS_CLASS[status]].join(" ")}
            title={`Q${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
