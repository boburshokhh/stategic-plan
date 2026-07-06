import styles from "./CompletenessBar.module.css";

interface CompletenessBarProps {
  percent: number;
  completed?: number;
  total?: number;
  showLabel?: boolean;
  /** Подпись справа, например «2/5 Шагов» */
  unitLabel?: string;
  /** primary — всегда синий акцент (как в Stitch) */
  tone?: "threshold" | "primary";
}

function thresholdVariant(percent: number) {
  if (percent < 50) return "danger";
  if (percent < 80) return "warning";
  return "success";
}

/** Progress bar полноты (department_description.md §3.1): X% (completed/total). */
export function CompletenessBar({
  percent,
  completed,
  total,
  showLabel = true,
  unitLabel,
  tone = "threshold",
}: CompletenessBarProps) {
  const variant = tone === "primary" ? "primary" : thresholdVariant(percent);
  const rightLabel =
    unitLabel ?? (typeof completed === "number" && typeof total === "number" ? `${completed}/${total}` : undefined);

  return (
    <div className={styles.wrapper}>
      {showLabel && (
        <div className={styles.label}>
          <span className={styles.percent}>{percent}%</span>
          {rightLabel && <span className={styles.unit}>{rightLabel}</span>}
        </div>
      )}
      <div className={styles.track}>
        <div className={[styles.fill, styles[variant]].join(" ")} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}
