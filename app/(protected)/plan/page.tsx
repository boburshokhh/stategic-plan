"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { usePageHeader } from "../../../lib/layout/PageHeaderContext";
import { usePeriod } from "../../../lib/period/PeriodContext";
import { useAuth } from "../../../lib/auth/AuthContext";
import { useActivePlan } from "../../../lib/hooks/usePlan";
import { useMyReports } from "../../../lib/hooks/useReports";
import { buildMyReportsMap, computePlanSummary, getEnrolledSubtaskIds } from "../../../lib/plan/planStats";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PlanPageHeader } from "../../../components/plan/PlanPageHeader";
import { PlanYearTabs } from "../../../components/plan/PlanYearTabs";
import { DirectionAccordion } from "../../../components/plan/DirectionAccordion";
import { PlanSummaryCards } from "../../../components/plan/PlanSummaryCards";
import styles from "./page.module.css";

const PLAN_DESCRIPTION =
  "Долгосрочный план развития газотранспортной системы Asia Trans Gas: операционные цели, технологическая модернизация и развитие человеческого капитала.";

export default function PlanPage() {
  usePageHeader("Стратегический план", [{ label: "Стратегический план" }]);
  const { user } = useAuth();
  const { selectedPeriod, year: periodYear } = usePeriod();
  const canEditReports = user?.role === "dept_user" && Boolean(user.departmentId);
  const { data: plan, isLoading, isError, refetch } = useActivePlan();
  const { data: myReports } = useMyReports(selectedPeriod?.id, canEditReports);
  const queryClient = useQueryClient();

  const [planYear, setPlanYear] = useState(periodYear);

  const enrolledSubtaskIds = useMemo(() => {
    if (!plan) return new Set<string>();
    return getEnrolledSubtaskIds(plan, planYear, user?.departmentId);
  }, [plan, planYear, user?.departmentId]);

  const myReportsBySubtaskId = useMemo(() => buildMyReportsMap(myReports ?? []), [myReports]);

  const summary = useMemo(() => {
    if (!plan) return null;
    return computePlanSummary(plan, planYear, enrolledSubtaskIds, myReportsBySubtaskId);
  }, [plan, planYear, enrolledSubtaskIds, myReportsBySubtaskId]);

  const handleReportEnsured = () => {
    queryClient.invalidateQueries({ queryKey: ["reports", "my"] });
  };

  return (
    <div className={styles.page}>
      {isLoading && <LoadingSkeleton lines={6} height={48} />}
      {isError && <ErrorAlert message="Не удалось загрузить стратегический план" onRetry={() => refetch()} />}

      {!isLoading && !isError && plan && (
        <>
          <PlanPageHeader
            title={plan.title}
            yearFrom={plan.yearFrom}
            yearTo={plan.yearTo}
            description={PLAN_DESCRIPTION}
          />

          <PlanYearTabs year={planYear} onChange={setPlanYear} />

          <div className={styles.directions}>
            {plan.directions.map((direction, index) => (
              <DirectionAccordion
                key={direction.id}
                direction={direction}
                year={planYear}
                defaultOpen={index === 0}
                enrolledSubtaskIds={enrolledSubtaskIds}
                myReportsBySubtaskId={myReportsBySubtaskId}
                periodId={selectedPeriod?.id}
                canEditReports={canEditReports}
                onReportEnsured={handleReportEnsured}
              />
            ))}
          </div>

          {summary && enrolledSubtaskIds.size > 0 && (
            <PlanSummaryCards
              totalSubtasks={summary.totalSubtasks}
              directionCount={summary.directionCount}
              delayedCount={summary.delayedCount}
            />
          )}
        </>
      )}
    </div>
  );
}
