"use client";

import Link from "next/link";
import { ClipboardList, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePageHeader } from "../../../lib/layout/PageHeaderContext";
import { usePeriod } from "../../../lib/period/PeriodContext";
import { useAuth } from "../../../lib/auth/AuthContext";
import { useMyReports } from "../../../lib/hooks/useReports";
import { importApi } from "../../../lib/api/endpoints";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorAlert } from "../../../components/ui/ErrorAlert";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { MyReportsTable, sortReports } from "../../../components/reports/MyReportsTable";
import { PhaseBanner } from "../../../components/dashboard/PhaseBanner";
import { ReportingCalendar } from "../../../components/dashboard/ReportingCalendar";

export default function DashboardPage() {
  usePageHeader("Дашборд");
  const { user } = useAuth();
  const { selectedPeriod } = usePeriod();
  const { data: reports, isLoading, isError, refetch } = useMyReports(selectedPeriod?.id);
  const { data: importStatus } = useQuery({
    queryKey: ["import", "status"],
    queryFn: importApi.getStatus,
    enabled: user?.role === "admin",
  });

  const topReports = reports ? sortReports(reports).slice(0, 5) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PhaseBanner />

      {user?.role === "admin" && importStatus && (
        <Card
          title="Данные плана в системе"
          subtitle={
            importStatus.lastImport
              ? `Импортировано из Excel: ${importStatus.lastImport.fileName}`
              : "План ещё не импортирован"
          }
          actions={
            <Link
              href="/admin/import"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-primary)", fontSize: "0.8125rem", fontWeight: 500 }}
            >
              Управление импортом <ArrowRight size={14} />
            </Link>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12 }}>
            {[
              { label: "Направлений", value: importStatus.planStats.directions },
              { label: "Задач", value: importStatus.planStats.tasks },
              { label: "Подзадач", value: importStatus.planStats.subtasks },
              { label: "Отчётов", value: importStatus.planStats.quarterlyReports },
              { label: "Отделов", value: importStatus.planStats.departments },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: 12,
                  borderRadius: "var(--radius-control)",
                  background: "color-mix(in srgb, var(--color-border) 30%, var(--color-bg-surface))",
                }}
              >
                <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-heading)" }}>{item.value}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-body)" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {user?.role === "dept_user" && (
        <Card
          title="Очередь отчётов"
          subtitle={selectedPeriod ? `Q${selectedPeriod.quarter} ${selectedPeriod.year}` : undefined}
          actions={
            <Link href="/reports/my" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-primary)", fontSize: "0.8125rem", fontWeight: 500 }}>
              Все отчёты <ArrowRight size={14} />
            </Link>
          }
        >
          {isLoading && <LoadingSkeleton lines={3} height={40} />}
          {isError && <ErrorAlert message="Не удалось загрузить отчёты" onRetry={() => refetch()} />}
          {!isLoading && !isError && topReports.length === 0 && (
            <EmptyState icon={ClipboardList} title="Отчётов пока нет" description="Отчёты появятся, когда будут назначены подзадачи вашему отделу." />
          )}
          {!isLoading && !isError && topReports.length > 0 && <MyReportsTable reports={topReports} />}
        </Card>
      )}

      <Card title="Календарь отчётности" subtitle="Окна сбора и агрегации по кварталам">
        <ReportingCalendar />
      </Card>
    </div>
  );
}
