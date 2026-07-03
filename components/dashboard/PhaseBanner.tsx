import Link from "next/link";
import { ClipboardEdit, BarChart3, PlayCircle } from "lucide-react";
import { usePeriod } from "../../lib/period/PeriodContext";
import { useAuth } from "../../lib/auth/AuthContext";
import { Button } from "../ui/Button";
import { formatDate } from "../../lib/format";
import styles from "./PhaseBanner.module.css";

const PHASE_CONFIG = {
  collection: {
    icon: ClipboardEdit,
    color: "var(--color-warning)",
    title: "Идёт сбор квартальной отчётности",
  },
  aggregation: {
    icon: BarChart3,
    color: "var(--color-info)",
    title: "Идёт агрегация отчётности направлениями",
  },
  execution: {
    icon: PlayCircle,
    color: "var(--color-secondary)",
    title: "Период выполнения плана",
  },
} as const;

export function PhaseBanner() {
  const { phase, selectedPeriod, year, quarter } = usePeriod();
  const { user } = useAuth();
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  const subtitle =
    phase === "collection" && selectedPeriod
      ? `Дедлайн сдачи отчётов: ${formatDate(selectedPeriod.collectionEnd)}`
      : phase === "aggregation" && selectedPeriod
        ? `Проверка руководителями направлений до ${formatDate(selectedPeriod.aggregationEnd)}`
        : `Текущий квартал: Q${quarter} ${year}`;

  return (
    <div className={styles.banner}>
      <div className={styles.info}>
        <div className={styles.iconWrap} style={{ background: `color-mix(in srgb, ${config.color} 16%, #fff)` }}>
          <Icon size={22} color={config.color} strokeWidth={1.75} />
        </div>
        <div className={styles.textBlock}>
          <span className={styles.title}>{config.title}</span>
          <span className={styles.subtitle}>{subtitle}</span>
        </div>
      </div>
      {user?.role === "dept_user" && (
        <Link href="/reports/my">
          <Button variant="primary">Перейти к отчётам</Button>
        </Link>
      )}
    </div>
  );
}
