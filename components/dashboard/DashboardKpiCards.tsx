import { ClipboardList, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import type { DashboardOverview } from "../../lib/api/types";
import type { QuarterlyReport } from "../../lib/api/types";
import styles from "./DashboardKpiCards.module.css";

interface DeptKpiProps {
  reports: QuarterlyReport[];
}

interface AdminKpiProps {
  overview: DashboardOverview;
}

export function DeptUserKpiCards({ reports }: DeptKpiProps) {
  const total = reports.length;
  const completed = reports.filter((r) => r.status === "completed").length;
  const inProgress = reports.filter((r) => r.status === "in_progress").length;
  const pending = reports.filter((r) => r.status === "not_started").length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const cards = [
    {
      label: "Назначено задач",
      value: total,
      icon: ClipboardList,
      iconClass: styles.iconPrimary,
      badge: null,
    },
    {
      label: "Выполнено",
      value: completed,
      icon: CheckCircle2,
      iconClass: styles.iconSuccess,
      badge: `${rate}%`,
      badgeClass: styles.badgeSuccess,
    },
    {
      label: "В работе",
      value: inProgress,
      icon: Clock,
      iconClass: styles.iconWarning,
      badge: pending > 0 ? `${pending} не начато` : null,
      badgeClass: styles.badgeWarning,
    },
    {
      label: "Ожидают сдачи",
      value: pending + inProgress,
      icon: AlertTriangle,
      iconClass: styles.iconDanger,
      badge: pending > 0 ? "Требуют внимания" : null,
      badgeClass: styles.badgeDanger,
      valueClass: pending + inProgress > 0 ? styles.valueDanger : undefined,
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={[styles.iconWrap, card.iconClass].join(" ")}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              {card.badge && <span className={[styles.badge, card.badgeClass].join(" ")}>{card.badge}</span>}
            </div>
            <div>
              <div className={styles.label}>{card.label}</div>
              <div className={[styles.value, card.valueClass].filter(Boolean).join(" ")}>{card.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminKpiCards({ overview }: AdminKpiProps) {
  const { totals, overallCompletenessPercent } = overview;

  const cards = [
    {
      label: "Общая готовность",
      value: `${overallCompletenessPercent}%`,
      valueClass: styles.valuePrimary,
      icon: TrendingUp,
      iconClass: styles.iconPrimary,
      progress: overallCompletenessPercent,
    },
    {
      label: "Отчётов сдано",
      value: totals.completed,
      icon: CheckCircle2,
      iconClass: styles.iconSuccess,
      hint: `из ${totals.totalExpected} ожидаемых`,
    },
    {
      label: "В процессе",
      value: totals.inProgress,
      icon: Clock,
      iconClass: styles.iconWarning,
      hint: totals.missingCount > 0 ? `Не поданы: ${totals.missingCount}` : undefined,
    },
    {
      label: "Не поданы",
      value: totals.missingCount,
      valueClass: totals.missingCount > 0 ? styles.valueDanger : undefined,
      icon: AlertTriangle,
      iconClass: styles.iconDanger,
      hint: totals.missingCount > 0 ? "Критический статус" : "Все отделы сдали",
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={[styles.iconWrap, card.iconClass].join(" ")}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
            </div>
            <div>
              <div className={styles.label}>{card.label}</div>
              <div className={[styles.value, card.valueClass].filter(Boolean).join(" ")}>{card.value}</div>
              {card.progress !== undefined && (
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${card.progress}%` }} />
                </div>
              )}
              {card.hint && <div className={styles.hint}>{card.hint}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
