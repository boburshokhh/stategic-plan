import Link from "next/link";
import { Edit3, ListChecks } from "lucide-react";
import { usePeriod } from "../../lib/period/PeriodContext";
import { useAuth } from "../../lib/auth/AuthContext";
import { formatQuarterYear } from "../../lib/format";
import styles from "./PhaseBanner.module.css";

interface PhaseBannerProps {
  needsTaskSelection?: boolean;
}

export function PhaseBanner({ needsTaskSelection = false }: PhaseBannerProps) {
  const { year, quarter } = usePeriod();
  const { user } = useAuth();
  const isAdminView = user?.role === "admin" || user?.role === "direction_head";
  const isDeptUser = user?.role === "dept_user";

  if (isDeptUser && needsTaskSelection) {
    return (
      <section className={styles.banner}>
        <div className={styles.decor} aria-hidden>
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <circle cx="300" cy="100" r="150" stroke="white" strokeWidth="40" />
            <circle cx="300" cy="100" r="100" stroke="white" strokeWidth="20" />
          </svg>
        </div>

        <div className={styles.inner}>
          <div className={styles.info}>
            <div className={styles.meta}>
              <span className={styles.phaseBadge}>Шаг 1 · Выбор задач</span>
              <span className={styles.periodLabel}>{formatQuarterYear(quarter, year)}</span>
            </div>
            <h2 className={styles.title}>Перед отчётностью выберите подзадачи</h2>
            <p className={styles.subtitle}>
              Если вы ещё не выбрали задачи в разделе «Стратегический план», для начала работы перейдите в «Выбор
              подзадач» и отметьте те, в которых участвует ваш отдел или департамент. После этого можно в любое время
              заполнять квартальные отчёты.
            </p>
            <ol className={styles.steps}>
              <li>Откройте «Стратегический план» → «Выбор подзадач».</li>
              <li>Найдите и отметьте подзадачи вашего отдела на {year} год.</li>
              <li>Вернитесь на дашборд — появятся отчёты, графики и кнопка «Перейти к отчётам».</li>
            </ol>
          </div>

          <div className={styles.actions}>
            <Link href="/plan/participation" className={styles.ctaButton}>
              <ListChecks size={18} strokeWidth={2} />
              Выбрать подзадачи
            </Link>
            <Link href="/plan" className={styles.ctaButtonSecondary}>
              Стратегический план
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const title = isAdminView ? "Контроль отчётности по плану" : "Работа с квартальными отчётами";
  const subtitle = isAdminView
    ? `Сводка за ${formatQuarterYear(quarter, year)}. Отделы могут заполнять отчёты в любое время — контролируйте полноту по направлениям.`
    : `${formatQuarterYear(quarter, year)}. Вы можете в любое время выбирать подзадачи и вводить отчёты. Переключите квартал вверху страницы, чтобы работать с нужным периодом.`;

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
            <Link href="/plan/participation" className={styles.ctaButtonSecondary}>
              <ListChecks size={18} strokeWidth={2} />
              Выбор подзадач
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
