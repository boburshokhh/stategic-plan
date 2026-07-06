"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { periodsApi } from "../api/endpoints";
import type { ReportingPeriod, ReportPhase } from "../api/types";

interface PeriodContextValue {
  year: number;
  quarter: number;
  periods: ReportingPeriod[];
  selectedPeriod: ReportingPeriod | null;
  phase: ReportPhase;
  isLoading: boolean;
  setYear: (year: number) => void;
  setQuarter: (quarter: number) => void;
}

const PLAN_YEARS = [2026, 2027, 2028];

function computePhase(_period: ReportingPeriod | null): ReportPhase {
  return "execution";
}

const PeriodContext = createContext<PeriodContextValue | null>(null);

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [didInitFromCurrent, setDidInitFromCurrent] = useState(false);

  const currentPeriodQuery = useQuery({
    queryKey: ["reporting-periods", "current"],
    queryFn: periodsApi.findCurrent,
  });

  const periodsQuery = useQuery({
    queryKey: ["reporting-periods", year],
    queryFn: () => periodsApi.findAll(year),
  });

  // Однократно подставляем текущий отчётный период с сервера как выбранный по умолчанию.
  if (!didInitFromCurrent && currentPeriodQuery.data) {
    setDidInitFromCurrent(true);
    setYear(currentPeriodQuery.data.year);
    setQuarter(currentPeriodQuery.data.quarter);
  }

  const periods = useMemo(() => periodsQuery.data ?? [], [periodsQuery.data]);
  const selectedPeriod = useMemo(
    () => periods.find((period) => period.quarter === quarter) ?? null,
    [periods, quarter],
  );
  const phase = useMemo(() => computePhase(selectedPeriod), [selectedPeriod]);

  const value = useMemo<PeriodContextValue>(
    () => ({
      year,
      quarter,
      periods,
      selectedPeriod,
      phase,
      isLoading: periodsQuery.isLoading || currentPeriodQuery.isLoading,
      setYear,
      setQuarter,
    }),
    [year, quarter, periods, selectedPeriod, phase, periodsQuery.isLoading, currentPeriodQuery.isLoading],
  );

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error("usePeriod должен использоваться внутри PeriodProvider");
  }
  return context;
}

export { PLAN_YEARS };
