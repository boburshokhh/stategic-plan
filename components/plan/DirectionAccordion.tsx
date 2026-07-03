"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { StrategicPlanTree } from "../../lib/api/types";
import { SubtaskRow } from "./SubtaskRow";
import styles from "./DirectionAccordion.module.css";

type DirectionWithTree = StrategicPlanTree["directions"][number];

interface DirectionAccordionProps {
  direction: DirectionWithTree;
  year: number;
  defaultOpen?: boolean;
  ownDepartmentId?: string | null;
  periodId?: string;
  onOpenSubtask: (subtaskId: string) => void;
}

export function DirectionAccordion({
  direction,
  year,
  defaultOpen,
  ownDepartmentId,
  periodId,
  onOpenSubtask,
}: DirectionAccordionProps) {
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));
  const theme = direction.yearThemes.find((item) => item.year === year)?.themeTitle;

  return (
    <div className={styles.direction}>
      <div className={styles.header} onClick={() => setIsOpen((open) => !open)}>
        <span className={styles.code}>{direction.code}</span>
        <div className={styles.headerText}>
          <span className={styles.name}>{direction.name}</span>
          {theme && <span className={styles.theme}>{theme}</span>}
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className={styles.body}>
          {direction.tasks.map((task) => {
            const subtasksForYear = task.subtasks.filter((subtask) => subtask.year === year);
            if (subtasksForYear.length === 0) return null;
            return (
              <div key={task.id} className={styles.task}>
                <div className={styles.taskTitle}>
                  {task.number ? `${task.number}. ` : ""}
                  {task.title}
                </div>
                {subtasksForYear.map((subtask) => (
                  <SubtaskRow
                    key={subtask.id}
                    subtask={subtask}
                    ownDepartmentId={ownDepartmentId}
                    periodId={periodId}
                    onClick={() => onOpenSubtask(subtask.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
