"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { QuarterlyReport, StrategicPlanTree } from "../../lib/api/types";
import { computeDirectionStats } from "../../lib/plan/planStats";
import { getDirectionVisual } from "../../lib/plan/directionMeta";
import { TaskAccordion } from "./TaskAccordion";
import styles from "./DirectionAccordion.module.css";

type DirectionWithTree = StrategicPlanTree["directions"][number];

interface DirectionAccordionProps {
  direction: DirectionWithTree;
  year: number;
  defaultOpen?: boolean;
  enrolledSubtaskIds: Set<string>;
  myReportsBySubtaskId: Map<string, QuarterlyReport>;
  periodId?: string;
  canEditReports: boolean;
  onReportEnsured: () => void;
}

export function DirectionAccordion({
  direction,
  year,
  defaultOpen,
  enrolledSubtaskIds,
  myReportsBySubtaskId,
  periodId,
  canEditReports,
  onReportEnsured,
}: DirectionAccordionProps) {
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));
  const theme = direction.yearThemes.find((item) => item.year === year)?.themeTitle;
  const visual = getDirectionVisual(direction.code);
  const stats = computeDirectionStats(direction, year, enrolledSubtaskIds, myReportsBySubtaskId);
  const Icon = visual.icon;

  const tasksForYear = direction.tasks
    .map((task) => ({
      task,
      subtasks: task.subtasks.filter((subtask) => subtask.year === year),
    }))
    .filter((entry) => entry.subtasks.length > 0);

  if (tasksForYear.length === 0) return null;

  return (
    <div className={[styles.direction, isOpen ? styles.directionOpen : ""].join(" ")}>
      <button type="button" className={styles.header} onClick={() => setIsOpen((open) => !open)}>
        <div className={styles.headerMain}>
          <div className={[styles.iconWrap, styles[`accent_${visual.accentClass}`]].join(" ")}>
            <Icon size={20} strokeWidth={1.75} />
          </div>
          <div className={styles.headerText}>
            <span className={styles.name}>{direction.name}</span>
            <span className={styles.meta}>
              {stats.taskCount} {stats.taskCount === 1 ? "ЗАДАЧА" : stats.taskCount < 5 ? "ЗАДАЧИ" : "ЗАДАЧ"} • {stats.label}
            </span>
            {theme && <span className={styles.theme}>{theme}</span>}
          </div>
        </div>
        <ChevronDown size={20} className={[styles.chevron, isOpen ? styles.chevronOpen : ""].join(" ")} />
      </button>

      {isOpen && (
        <div className={styles.body}>
          <div className={styles.taskList}>
            {tasksForYear.map(({ task, subtasks }, index) => (
              <TaskAccordion
                key={task.id}
                task={task}
                subtasks={subtasks}
                defaultOpen={index === 0}
                enrolledSubtaskIds={enrolledSubtaskIds}
                myReportsBySubtaskId={myReportsBySubtaskId}
                periodId={periodId}
                canEditReports={canEditReports}
                onReportEnsured={onReportEnsured}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
