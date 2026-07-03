import styles from "./CompletenessBar.module.css";

interface CompletenessBarProps {
  percent: number;
  completed?: number;
  total?: number;
  showLabel?: boolean;
}

function thresholdVariant(percent: number) {
  if (percent < 50) return "danger";
  if (percent < 80) return "warning";
  return "success";
}

/** Progress bar полноты (department_description.md §3.1): X% (completed/total). */
export function CompletenessBar({ percent, completed, total, showLabel = true }: CompletenessBarProps) {
  const variant = thresholdVariant(percent);

  return (
    <div className={styles.wrapper}>
      {showLabel && (
        <div className={styles.label}>
          <span className={styles.percent}>{percent}%</span>
          {typeof completed === "number" && typeof total === "number" && (
            <span>
              {completed}/{total}
            </span>
          )}
        </div>
      )}
      <div className={styles.track}>
        <div className={[styles.fill, styles[variant]].join(" ")} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}
