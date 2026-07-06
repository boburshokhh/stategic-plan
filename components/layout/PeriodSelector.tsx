"use client";

import { usePeriod, PLAN_YEARS } from "../../lib/period/PeriodContext";
import styles from "./PeriodSelector.module.css";

export function PeriodSelector() {
  const { year, quarter, setYear, setQuarter } = usePeriod();

  return (
    <div className={styles.wrapper}>
      <select className={styles.select} value={year} onChange={(event) => setYear(Number(event.target.value))}>
        {PLAN_YEARS.map((planYear) => (
          <option key={planYear} value={planYear}>
            {planYear}
          </option>
        ))}
      </select>
      <select className={styles.select} value={quarter} onChange={(event) => setQuarter(Number(event.target.value))}>
        {[1, 2, 3, 4].map((q) => (
          <option key={q} value={q}>
            Квартал {q}
          </option>
        ))}
      </select>
    </div>
  );
}
