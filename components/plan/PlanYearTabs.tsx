import { PLAN_YEARS } from "../../lib/period/PeriodContext";
import styles from "./PlanYearTabs.module.css";

interface PlanYearTabsProps {
  year: number;
  onChange: (year: number) => void;
}

export function PlanYearTabs({ year, onChange }: PlanYearTabsProps) {
  return (
    <div className={styles.wrap}>
      {PLAN_YEARS.map((planYear) => (
        <button
          key={planYear}
          type="button"
          className={[styles.tab, planYear === year ? styles.tabActive : ""].join(" ")}
          onClick={() => onChange(planYear)}
        >
          {planYear}
        </button>
      ))}
    </div>
  );
}
