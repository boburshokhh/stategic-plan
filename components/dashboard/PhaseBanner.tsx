"use client";

import Link from "next/link";
import { Edit3 } from "lucide-react";
import { usePeriod } from "../../lib/period/PeriodContext";
import { useAuth } from "../../lib/auth/AuthContext";
import { formatQuarterYear } from "../../lib/format";
import styles from "./PhaseBanner.module.css";

export function PhaseBanner() {
  const { year, quarter } = usePeriod();
  const { user } = useAuth();
  const isAdminView = user?.role === "admin" || user?.role === "direction_head";
  const isDeptUser = user?.role === "dept_user";

  const title = isAdminView ? "Контроль отчётности по плану" : "Работа с квартальными отчётами";
  const subtitle = isAdminView
    ? `Сводка за ${formatQuarterYear(quarter, year)}. Отделы заполняют отчёты по назначенным подзадачам — контролируйте полноту по направлениям.`
    : `${formatQuarterYear(quarter, year)}. Заполняйте отчёты по подзадачам, назначенным вашему отделу в стратегическом плане. Переключите квартал вверху страницы, чтобы работать с нужным периодом.`;

  return (
    <section className={[styles.banner, isAdminView ? styles.bannerAdmin : ""].join(" ")}>
      <div className={styles.decor} aria-hidden>
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <circle cx="300" cy="100" r="150" stroke="white" strokeWidth="40" />
          <circle cx="300" cy="100" r="100" stroke="white" strokeWidth="20" />
        </svg>
      </div>

      <div className={styles.inner}>
        <div className={styles.info}>
          <div className={styles.meta}>
            <span className={styles.phaseBadge}>Отчётный квартал</span>
            <span className={styles.periodLabel}>{formatQuarterYear(quarter, year)}</span>
          </div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.actions}>
          {isDeptUser && (
            <Link href="/reports/my" className={styles.ctaButton}>
              <Edit3 size={18} strokeWidth={2} />
              Перейти к отчётам
            </Link>
          )}
          {isDeptUser && (
            <Link href="/plan" className={styles.ctaButtonSecondary}>
              Стратегический план
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
