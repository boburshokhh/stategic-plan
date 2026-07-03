import { usePeriod } from "../../lib/period/PeriodContext";
import { formatDate } from "../../lib/format";
import styles from "./ReportingCalendar.module.css";

export function ReportingCalendar() {
  const { periods, quarter, setQuarter } = usePeriod();

  return (
    <div className={styles.grid}>
      {[1, 2, 3, 4].map((q) => {
        const period = periods.find((item) => item.quarter === q);
        return (
          <button
            key={q}
            type="button"
            className={[styles.quarter, q === quarter ? styles.quarterActive : ""].join(" ")}
            onClick={() => setQuarter(q)}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <span className={styles.quarterLabel}>Q{q}</span>
            {period ? (
              <>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>Сбор</span>
                  <span className={styles.rowValue}>
                    {formatDate(period.collectionStart)} — {formatDate(period.collectionEnd)}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>Агрегация</span>
                  <span className={styles.rowValue}>
                    {formatDate(period.aggregationStart)} — {formatDate(period.aggregationEnd)}
                  </span>
                </div>
              </>
            ) : (
              <span className={styles.rowValue}>Нет данных</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
