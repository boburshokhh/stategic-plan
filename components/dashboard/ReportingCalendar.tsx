import { AlertTriangle, Calendar } from "lucide-react";
import { usePeriod } from "../../lib/period/PeriodContext";
import { formatDate, formatQuarter, daysUntil } from "../../lib/format";
import styles from "./ReportingCalendar.module.css";

function quarterStatus(q: number, currentQuarter: number, now: Date, collectionEnd?: string) {
  if (q < currentQuarter) return "closed" as const;
  if (q > currentQuarter) return q === currentQuarter + 1 ? "scheduled" : "future";
  if (collectionEnd && now > new Date(collectionEnd)) return "closed" as const;
  return "current" as const;
}

const STATUS_LABELS = {
  closed: "Закрыт",
  current: "Текущий",
  scheduled: "Запланирован",
  future: "Будущий",
} as const;

export function ReportingCalendar() {
  const { periods, quarter, year, setQuarter, phase, selectedPeriod } = usePeriod();
  const now = new Date();

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Календарь отчётности</h2>
        <p className={styles.subtitle}>Окна сбора и агрегации · {year}</p>
      </div>

      <div className={styles.timeline}>
        {[1, 2, 3, 4].map((q) => {
          const period = periods.find((item) => item.quarter === q);
          const status = quarterStatus(q, quarter, now, period?.collectionEnd);
          const isActive = q === quarter;
          const isPast = q < quarter;

          return (
            <button
              key={q}
              type="button"
              className={[
                styles.item,
                isActive ? styles.itemActive : "",
                isPast ? styles.itemPast : "",
              ].join(" ")}
              onClick={() => setQuarter(q)}
              style={{ textAlign: "left", cursor: "pointer", background: "none", border: "none", width: "100%" }}
            >
              <div
                className={[
                  styles.dot,
                  isActive ? styles.dotActive : "",
                  isPast ? styles.dotPast : "",
                ].join(" ")}
              />
              <div className={styles.itemHeader}>
                <span className={[styles.itemTitle, isActive ? styles.itemTitleActive : ""].join(" ")}>
                  {formatQuarter(q)} · отчётный период
                </span>
                <span
                  className={[
                    styles.statusBadge,
                    status === "closed"
                      ? styles.statusClosed
                      : status === "current"
                        ? styles.statusCurrent
                        : status === "scheduled"
                          ? styles.statusScheduled
                          : styles.statusFuture,
                  ].join(" ")}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>

              {period ? (
                <>
                  <div className={[styles.dates, isActive ? styles.datesActive : ""].join(" ")}>
                    Сбор: {formatDate(period.collectionStart)} — {formatDate(period.collectionEnd)}
                  </div>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Агрегация</span>
                    <span className={styles.rowValue}>
                      {formatDate(period.aggregationStart)} — {formatDate(period.aggregationEnd)}
                    </span>
                  </div>
                  {isActive && phase === "collection" && selectedPeriod && daysUntil(selectedPeriod.collectionEnd) >= 0 && (
                    <div className={styles.alert}>
                      <AlertTriangle size={14} />
                      Закрытие через {daysUntil(selectedPeriod.collectionEnd)} дн.
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.dates}>Нет данных</div>
              )}
            </button>
          );
        })}
      </div>

      <button type="button" className={styles.footerBtn}>
        <Calendar size={16} />
        Полный график
      </button>
    </div>
  );
}
