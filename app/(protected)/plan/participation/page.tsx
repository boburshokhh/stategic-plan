"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare, Info } from "lucide-react";
import { usePageHeader } from "../../../../lib/layout/PageHeaderContext";
import { usePeriod } from "../../../../lib/period/PeriodContext";
import { useAuth } from "../../../../lib/auth/AuthContext";
import {
  useMySubtaskParticipation,
  useParticipateInSubtasks,
  useUnparticipateFromSubtask,
} from "../../../../lib/hooks/useDepartmentParticipation";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input, Select } from "../../../../components/ui/FormField";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ErrorAlert } from "../../../../components/ui/ErrorAlert";
import { LoadingSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { PlanYearTabs } from "../../../../components/plan/PlanYearTabs";
import {
  SubtaskParticipationList,
  type ParticipationFilter,
} from "../../../../components/plan/SubtaskParticipationList";

export default function PlanParticipationPage() {
  usePageHeader("Выбор подзадач", [
    { label: "Стратегический план", href: "/plan" },
    { label: "Выбор подзадач" },
  ]);

  const { user } = useAuth();
  const { year: periodYear } = usePeriod();
  const [planYear, setPlanYear] = useState(periodYear);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ParticipationFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);

  const { data: items, isLoading, isError, refetch } = useMySubtaskParticipation(planYear);
  const participate = useParticipateInSubtasks();
  const unparticipate = useUnparticipateFromSubtask();

  const enrolledCount = useMemo(() => items?.filter((item) => item.enrollment).length ?? 0, [items]);

  const toggleSelection = (subtaskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(subtaskId)) next.delete(subtaskId);
      else next.add(subtaskId);
      return next;
    });
  };

  const handleParticipate = async () => {
    if (selectedIds.size === 0) return;
    setSuccessMessage(null);
    try {
      const result = await participate.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSuccessMessage(
        result.enrolled > 0
          ? `Участие подтверждено в ${result.enrolled} подзадачах`
          : "Выбранные подзадачи уже были в вашем списке",
      );
    } catch {
      // ErrorAlert via mutation state if needed
    }
  };

  const handleUnenroll = async (subtaskId: string) => {
    setSuccessMessage(null);
    setUnenrollingId(subtaskId);
    try {
      await unparticipate.mutateAsync(subtaskId);
      setSuccessMessage("Участие снято");
    } finally {
      setUnenrollingId(null);
    }
  };

  if (user?.role !== "dept_user" || !user.departmentId) {
    return (
      <Card>
        <EmptyState
          title="Недоступно"
          description="Выбор подзадач доступен только сотрудникам отдела с привязкой к справочнику."
          action={
            <Link href="/plan">
              <Button variant="outline">К стратегическому плану</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="page-banner">
        <Info size={16} />
        <span>
          Отметьте подзадачи {planYear} года, в которых участвует ваш отдел ({user.department?.shortName ?? user.department?.name}).
          После подтверждения отдел станет участником и сможет сдавать квартальные отчёты.
        </span>
      </div>

      {successMessage && (
        <div className="page-banner" style={{ background: "color-mix(in srgb, var(--color-success) 12%, #fff)" }}>
          <CheckSquare size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      <Card
        title="Подзадачи года"
        subtitle={enrolledCount > 0 ? `Участвуете в ${enrolledCount} подзадачах` : "Пока нет выбранных подзадач"}
      >
        <PlanYearTabs year={planYear} onChange={(year) => { setPlanYear(year); setSelectedIds(new Set()); }} />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16, marginBottom: 16 }}>
          <Input
            placeholder="Поиск по названию, задаче, направлению"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ minWidth: 240, flex: 1 }}
          />
          <Select value={filter} onChange={(event) => setFilter(event.target.value as ParticipationFilter)}>
            <option value="all">Все подзадачи</option>
            <option value="mine">Мои подзадачи</option>
            <option value="available">Доступные для выбора</option>
          </Select>
        </div>

        {isLoading && <LoadingSkeleton lines={5} height={40} />}
        {isError && <ErrorAlert message="Не удалось загрузить список подзадач" onRetry={() => refetch()} />}
        {(participate.isError || unparticipate.isError) && (
          <ErrorAlert message="Не удалось сохранить изменения. Попробуйте ещё раз." />
        )}

        {!isLoading && !isError && items && (
          <SubtaskParticipationList
            items={items}
            filter={filter}
            search={search}
            selectedIds={selectedIds}
            onToggle={toggleSelection}
            onUnenroll={handleUnenroll}
            unenrollingId={unenrollingId}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-body)" }}>
            Выбрано: {selectedIds.size}
          </span>
          <Button
            variant="primary"
            loading={participate.isPending}
            disabled={selectedIds.size === 0}
            onClick={handleParticipate}
          >
            Подтвердить участие
          </Button>
        </div>
      </Card>
    </div>
  );
}
