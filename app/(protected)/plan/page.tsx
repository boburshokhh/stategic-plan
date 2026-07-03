"use client";

import { useMemo, useState } from "react";
import { usePageHeader } from "../../../lib/layout/PageHeaderContext";
import { usePeriod } from "../../../lib/period/PeriodContext";
import { useAuth } from "../../../lib/auth/AuthContext";
import { useActivePlan } from "../../../lib/hooks/usePlan";
import { Card } from "../../../components/ui/Card";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PlanYearTabs } from "../../../components/plan/PlanYearTabs";
import { DirectionAccordion } from "../../../components/plan/DirectionAccordion";
import { SubtaskReportsDrawer } from "../../../components/plan/SubtaskReportsDrawer";

export default function PlanPage() {
  usePageHeader("Стратегический план", [{ label: "Стратегический план" }]);
  const { user } = useAuth();
  const { selectedPeriod, year: periodYear } = usePeriod();
  const { data: plan, isLoading, isError, refetch } = useActivePlan();

  const [planYear, setPlanYear] = useState(periodYear);
  const [openSubtaskId, setOpenSubtaskId] = useState<string | null>(null);

  const allSubtasks = useMemo(() => {
    if (!plan) return [];
    return plan.directions.flatMap((direction) => direction.tasks.flatMap((task) => task.subtasks));
  }, [plan]);
  const openSubtask = allSubtasks.find((subtask) => subtask.id === openSubtaskId) ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <PlanYearTabs year={planYear} onChange={setPlanYear} />
      </Card>

      {isLoading && (
        <Card>
          <LoadingSkeleton lines={5} height={40} />
        </Card>
      )}
      {isError && <ErrorAlert message="Не удалось загрузить стратегический план" onRetry={() => refetch()} />}

      {!isLoading && !isError && plan && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {plan.directions.map((direction, index) => (
            <DirectionAccordion
              key={direction.id}
              direction={direction}
              year={planYear}
              defaultOpen={index === 0}
              ownDepartmentId={user?.departmentId}
              periodId={selectedPeriod?.id}
              onOpenSubtask={setOpenSubtaskId}
            />
          ))}
        </div>
      )}

      {openSubtask && (
        <SubtaskReportsDrawer
          subtask={openSubtask}
          ownDepartmentId={user?.departmentId}
          onClose={() => setOpenSubtaskId(null)}
        />
      )}
    </div>
  );
}
