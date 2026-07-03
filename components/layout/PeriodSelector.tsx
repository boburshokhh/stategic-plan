"use client";

import { usePeriod, PLAN_YEARS } from "../../lib/period/PeriodContext";
import { Badge } from "../ui/Badge";
import styles from "./PeriodSelector.module.css";

const PHASE_LABEL: Record<string, { label: string; variant: "warning" | "info" | "secondary" }> = {
  collection: { label: "Сбор отчётности", variant: "warning" },
  aggregation: { label: "Агрегация", variant: "info" },
  execution: { label: "Выполнение", variant: "secondary" },
};

export function PeriodSelector() {
  const { year, quarter, phase, setYear, setQuarter } = usePeriod();
  const phaseInfo = PHASE_LABEL[phase];

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
            Q{q}
          </option>
        ))}
      </select>
      <Badge variant={phaseInfo.variant}>{phaseInfo.label}</Badge>
    </div>
  );
}
