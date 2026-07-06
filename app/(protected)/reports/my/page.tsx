"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { usePageHeader } from "../../../../lib/layout/PageHeaderContext";
import { usePeriod } from "../../../../lib/period/PeriodContext";
import { useMyReports } from "../../../../lib/hooks/useReports";
import { Card } from "../../../../components/ui/Card";
import { Select, Input } from "../../../../components/ui/FormField";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ErrorAlert } from "../../../../components/ui/ErrorAlert";
import { LoadingSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { MyReportsTable, sortReports } from "../../../../components/reports/MyReportsTable";
import { Button } from "../../../../components/ui/Button";
import { formatQuarterYear } from "../../../../lib/format";
import type { ReportStatus } from "../../../../lib/api/types";

const STATUS_FILTERS: Array<{ value: ReportStatus | "all"; label: string }> = [
  { value: "all", label: "Все статусы" },
  { value: "not_started", label: "Не начато" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Выполнено" },
];

export default function MyReportsPage() {
  usePageHeader("Мои отчёты", [{ label: "Мои отчёты" }]);
  const { selectedPeriod } = usePeriod();
  const { data: reports, isLoading, isError, refetch } = useMyReports(selectedPeriod?.id);

  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [search, setSearch] = useState("");

  const directionOptions = useMemo(() => {
    const names = new Set<string>();
    reports?.forEach((report) => {
      const name = report.subtask?.task?.direction?.name;
      if (name) names.add(name);
    });
    return Array.from(names);
  }, [reports]);
  const [directionFilter, setDirectionFilter] = useState("all");

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return sortReports(
      reports.filter((report) => {
        if (statusFilter !== "all" && report.status !== statusFilter) return false;
        if (directionFilter !== "all" && report.subtask?.task?.direction?.name !== directionFilter) return false;
        if (search && !report.subtask?.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    );
  }, [reports, statusFilter, directionFilter, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card
        title="Очередь отчётов"
        subtitle={selectedPeriod ? formatQuarterYear(selectedPeriod.quarter, selectedPeriod.year) : undefined}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Input
            placeholder="Поиск по названию подзадачи"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ minWidth: 240, flex: 1 }}
          />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ReportStatus | "all")}>
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {directionOptions.length > 1 && (
            <Select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)}>
              <option value="all">Все направления</option>
              {directionOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          )}
        </div>

        {isLoading && <LoadingSkeleton lines={4} height={40} />}
        {isError && <ErrorAlert message="Не удалось загрузить отчёты" onRetry={() => refetch()} />}
        {!isLoading && !isError && filteredReports.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="Отчётов не найдено"
            description={
              reports?.length === 0
                ? "Сначала выберите подзадачи года, в которых участвует ваш отдел."
                : "Попробуйте изменить фильтры или выбрать другой отчётный период."
            }
            action={
              reports?.length === 0 ? (
                <Link href="/plan/participation">
                  <Button variant="primary">Выбрать подзадачи для участия</Button>
                </Link>
              ) : undefined
            }
          />
        )}
        {!isLoading && !isError && filteredReports.length > 0 && <MyReportsTable reports={filteredReports} />}
      </Card>
    </div>
  );
}
