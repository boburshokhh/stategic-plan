import type { StatusBreakdown } from "../../lib/dashboard/reportStats";
import { completionPercent } from "../../lib/dashboard/reportStats";
import { formatQuarterYear } from "../../lib/format";
import styles from "./QuarterCompletionGauge.module.css";

interface QuarterCompletionGaugeProps {
  breakdown: StatusBreakdown;
  quarter: number;
  year: number;
  emptyHint?: string;
  notStartedLegendLabel?: string;
}

const GAUGE_R = 72;
const GAUGE_CX = 100;
const GAUGE_CY = 98;
const GAUGE_STROKE = 12;
const ARC_LENGTH = Math.PI * GAUGE_R;

interface GaugeArcProps {
  percent: number;
}

function GaugeArc({ percent }: GaugeArcProps) {
  const progress = (Math.min(Math.max(percent, 0), 100) / 100) * ARC_LENGTH;
  const transform = `rotate(180 ${GAUGE_CX} ${GAUGE_CY})`;

  return (
    <svg className={styles.gaugeSvg} viewBox="0 0 200 120" aria-hidden>
      <circle
        className={styles.trackBg}
        cx={GAUGE_CX}
        cy={GAUGE_CY}
        r={GAUGE_R}
        fill="none"
        strokeWidth={GAUGE_STROKE}
        strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
        strokeDashoffset={0}
        transform={transform}
      />
      {progress > 0 && (
        <circle
          className={styles.trackFill}
          cx={GAUGE_CX}
          cy={GAUGE_CY}
          r={GAUGE_R}
          fill="none"
          strokeWidth={GAUGE_STROKE}
          strokeDasharray={`${progress} ${ARC_LENGTH}`}
          strokeDashoffset={0}
          transform={transform}
        />
      )}
    </svg>
  );
}

export function QuarterCompletionGauge({
  breakdown,
  quarter,
  year,
  emptyHint,
  notStartedLegendLabel = "Не начато",
}: QuarterCompletionGaugeProps) {
  const percent = completionPercent(breakdown);
  const { total, completed, inProgress, notStarted } = breakdown;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Готовность квартала</h3>
        <p className={styles.subtitle}>
          {formatQuarterYear(quarter, year)} · доля полностью сданных отчётов
        </p>
      </div>

      {total === 0 ? (
        <p className={styles.empty}>
          {emptyHint ?? "Статистика появится после выбора подзадач вашего отдела."}
        </p>
      ) : (
        <>
          <div className={styles.gaugeWrap}>
            <div className={styles.gauge}>
              <GaugeArc percent={percent} />
              <div className={styles.gaugeValue}>
                <div
                  className={styles.percent}
                  style={{
                    color:
                      percent >= 100
                        ? "var(--color-success)"
                        : percent >= 50
                          ? "var(--color-text-heading)"
                          : "var(--color-warning)",
                  }}
                >
                  {percent}%
                </div>
                <div className={styles.percentLabel}>выполнено</div>
              </div>
            </div>

            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <div className={[styles.legendValue, styles.legendValueSuccess].join(" ")}>{completed}</div>
                <div className={styles.legendLabel}>Сдано</div>
              </div>
              <div className={styles.legendItem}>
                <div className={[styles.legendValue, styles.legendValueWarning].join(" ")}>{inProgress}</div>
                <div className={styles.legendLabel}>В работе</div>
              </div>
              <div className={styles.legendItem}>
                <div className={[styles.legendValue, styles.legendValueMuted].join(" ")}>{notStarted}</div>
                <div className={styles.legendLabel}>{notStartedLegendLabel}</div>
              </div>
            </div>
          </div>

          <p className={styles.hint}>
            {completed} из {total} отчётов сданы полностью.
            {notStarted + inProgress > 0
              ? ` Осталось завершить: ${notStarted + inProgress}.`
              : " Все отчёты по кварталу сданы."}
          </p>
        </>
      )}
    </div>
  );
}
