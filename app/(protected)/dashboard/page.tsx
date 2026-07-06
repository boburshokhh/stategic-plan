"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePageHeader } from "../../../lib/layout/PageHeaderContext";
import { usePeriod } from "../../../lib/period/PeriodContext";
import { useAuth } from "../../../lib/auth/AuthContext";
import { useMyReports } from "../../../lib/hooks/useReports";
import { useMySubtaskParticipation } from "../../../lib/hooks/useDepartmentParticipation";
import { useDashboardOverview } from "../../../lib/hooks/useDashboard";
import { importApi } from "../../../lib/api/endpoints";
import { breakdownFromReports, breakdownFromOverview } from "../../../lib/dashboard/reportStats";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PhaseBanner } from "../../../components/dashboard/PhaseBanner";
import { AdminKpiCards } from "../../../components/dashboard/DashboardKpiCards";
import { TaskStatusChart } from "../../../components/dashboard/TaskStatusChart";
import { QuarterCompletionGauge } from "../../../components/dashboard/QuarterCompletionGauge";
import { MyReportsQueue } from "../../../components/dashboard/MyReportsQueue";
import { DirectionHealthGrid } from "../../../components/dashboard/DirectionHealthGrid";
import { MissingReportsTable } from "../../../components/dashboard/MissingReportsTable";
import { SystemStatusPanel } from "../../../components/dashboard/SystemStatusPanel";
import styles from "./page.module.css";

export default function DashboardPage() {
  usePageHeader("Дашборд");
  const { user } = useAuth();
  const { selectedPeriod, year, quarter } = usePeriod();
  const { data: reports, isLoading, isError, refetch } = useMyReports(selectedPeriod?.id);
  const { data: participation, isLoading: participationLoading } = useMySubtaskParticipation(year);
  const isOversight = user?.role === "admin" || user?.role === "direction_head";
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useDashboardOverview(year, quarter, isOversight);
  const { data: importStatus } = useQuery({
    queryKey: ["import", "status"],
    queryFn: importApi.getStatus,
    enabled: user?.role === "admin",
  });

  const enrolledCount = participation?.filter((item) => item.enrollment).length ?? 0;
  const needsTaskSelection =
    user?.role === "dept_user" && !isLoading && !participationLoading && !isError && enrolledCount === 0;

  const deptBreakdown = useMemo(() => breakdownFromReports(reports ?? []), [reports]);
  const adminBreakdown = useMemo(
    () => (overview ? breakdownFromOverview(overview) : { total: 0, completed: 0, inProgress: 0, notStarted: 0 }),
    [overview],
  );

  const chartEmptyHint =
    "Выберите подзадачи в разделе «Стратегический план → Выбор подзадач», чтобы увидеть статистику по кварталу.";

  return (
    <div className={styles.page}>
      <PhaseBanner needsTaskSelection={needsTaskSelection} />

      {user?.role === "dept_user" && (
        <>
          {isLoading ? (
            <LoadingSkeleton lines={3} height={120} />
          ) : isError ? (
            <ErrorAlert message="Не удалось загрузить отчёты" onRetry={() => refetch()} />
          ) : (
            <>
              <div className={styles.chartsRow}>
                <TaskStatusChart
                  breakdown={deptBreakdown}
                  quarter={quarter}
                  year={year}
                  emptyHint={chartEmptyHint}
                />
                <QuarterCompletionGauge
                  breakdown={deptBreakdown}
                  quarter={quarter}
                  year={year}
                  emptyHint={chartEmptyHint}
                />
              </div>

              <MyReportsQueue reports={reports ?? []} quarter={quarter} year={year} compact />
            </>
          )}
        </>
      )}

      {isOversight && (
        <>
          {overviewLoading ? (
            <LoadingSkeleton lines={4} height={48} />
          ) : overviewError || !overview ? (
            <ErrorAlert message="Не удалось загрузить сводку дашборда" onRetry={() => refetchOverview()} />
          ) : (
            <>
              <AdminKpiCards overview={overview} />

              <div className={styles.chartsRow}>
                <TaskStatusChart
                  breakdown={adminBreakdown}
                  quarter={quarter}
                  year={year}
                  notStartedLabel="Не поданы"
                />
                <QuarterCompletionGauge
                  breakdown={adminBreakdown}
                  quarter={quarter}
                  year={year}
                  notStartedLegendLabel="Не поданы"
                />
              </div>

              <div className={styles.adminMain}>
                <DirectionHealthGrid directions={overview.directions} />
                <MissingReportsTable items={overview.missingReports} quarter={quarter} year={year} />
                {user?.role === "admin" && importStatus && <SystemStatusPanel importStatus={importStatus} />}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
