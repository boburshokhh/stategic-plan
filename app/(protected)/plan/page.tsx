"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePageHeader } from "../../../lib/layout/PageHeaderContext";
import { usePeriod } from "../../../lib/period/PeriodContext";
import { useAuth } from "../../../lib/auth/AuthContext";
import { useActivePlan } from "../../../lib/hooks/usePlan";
import { useMyReports } from "../../../lib/hooks/useReports";
import {
  useParticipateInSubtasks,
  useUnparticipateFromSubtask,
} from "../../../lib/hooks/useDepartmentParticipation";
import { buildMyReportsMap, computePlanSummary, getEnrolledSubtaskIds } from "../../../lib/plan/planStats";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PlanPageHeader } from "../../../components/plan/PlanPageHeader";
import { PlanYearTabs } from "../../../components/plan/PlanYearTabs";
import { DirectionAccordion } from "../../../components/plan/DirectionAccordion";
import { PlanSummaryCards } from "../../../components/plan/PlanSummaryCards";
import styles from "./page.module.css";

const PLAN_DESCRIPTION =
  "Выберите подзадачи для участия вашего отдела. После подтверждения они появятся в «Мои отчёты», а здесь — кнопка для написания отчёта.";

export default function PlanPage() {
  usePageHeader("Стратегический план", [{ label: "Стратегический план" }]);
  const { user } = useAuth();
  const { selectedPeriod, year: periodYear } = usePeriod();
  const canParticipate = user?.role === "dept_user" && Boolean(user.departmentId);
  const { data: plan, isLoading, isError, refetch } = useActivePlan();
  const { data: myReports } = useMyReports(selectedPeriod?.id, canParticipate);
  const participateMutation = useParticipateInSubtasks();
  const unenrollMutation = useUnparticipateFromSubtask();
  const queryClient = useQueryClient();

  const [planYear, setPlanYear] = useState(periodYear);
  const [participatingId, setParticipatingId] = useState<string | null>(null);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);

  const enrolledSubtaskIds = useMemo(() => {
    if (!plan) return new Set<string>();
    return getEnrolledSubtaskIds(plan, planYear, user?.departmentId);
  }, [plan, planYear, user?.departmentId]);

  const myReportsBySubtaskId = useMemo(() => buildMyReportsMap(myReports ?? []), [myReports]);

  const summary = useMemo(() => {
    if (!plan) return null;
    return computePlanSummary(plan, planYear, user?.departmentId);
  }, [plan, planYear, user?.departmentId]);

  const handleParticipate = async (subtaskId: string) => {
    setParticipatingId(subtaskId);
    try {
      await participateMutation.mutateAsync([subtaskId]);
    } catch (error) {
      setParticipatingId(null);
      throw error;
    }
    setParticipatingId(null);
  };

  const handleUnenroll = async (subtaskId: string) => {
    setUnenrollingId(subtaskId);
    try {
      await unenrollMutation.mutateAsync(subtaskId);
    } finally {
      setUnenrollingId(null);
    }
  };

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
                departmentId={user?.departmentId}
                canParticipate={canParticipate}
                myReportsBySubtaskId={myReportsBySubtaskId}
                periodId={selectedPeriod?.id}
                participatingId={participatingId}
                onParticipate={canParticipate ? handleParticipate : undefined}
                onUnenroll={canParticipate ? handleUnenroll : undefined}
                unenrollingId={unenrollingId}
                onReportEnsured={handleReportEnsured}
              />
            ))}
          </div>

          {summary && enrolledSubtaskIds.size > 0 && (
            <PlanSummaryCards
              participantCount={summary.participantCount}
              ownerCount={summary.ownerCount}
              directionCount={summary.directionCount}
              delayedCount={0}
            />
          )}
        </>
      )}
    </div>
  );
}
