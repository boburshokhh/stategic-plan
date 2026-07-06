"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { QuarterlyReport, Subtask, Task } from "../../lib/api/types";
import { computeTaskStats } from "../../lib/plan/planStats";
import { SubtaskRow } from "./SubtaskRow";
import styles from "./TaskAccordion.module.css";

interface TaskAccordionProps {
  task: Task;
  subtasks: Subtask[];
  defaultOpen?: boolean;
  enrolledSubtaskIds: Set<string>;
  myReportsBySubtaskId: Map<string, QuarterlyReport>;
  ownDepartmentId?: string | null;
  periodId?: string;
  canSelect: boolean;
  participatingId: string | null;
  onParticipate: (subtaskId: string) => void;
  onReportEnsured: () => void;
}

export function TaskAccordion({
  task,
  subtasks,
  defaultOpen,
  enrolledSubtaskIds,
  myReportsBySubtaskId,
  ownDepartmentId,
  periodId,
  canSelect,
  participatingId,
  onParticipate,
  onReportEnsured,
}: TaskAccordionProps) {
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));
  const stats = computeTaskStats(subtasks, enrolledSubtaskIds, myReportsBySubtaskId);

  return (
    <div className={[styles.task, isOpen ? styles.taskOpen : ""].join(" ")}>
      <button type="button" className={styles.header} onClick={() => setIsOpen((open) => !open)}>
        <div className={styles.headerText}>
          <span className={styles.title}>
            {task.number ? `${task.number}. ` : ""}
            {task.title}
          </span>
          <span className={styles.meta}>
            {stats.subtaskCount}{" "}
            {stats.subtaskCount === 1 ? "ПОДЗАДАЧА" : stats.subtaskCount < 5 ? "ПОДЗАДАЧИ" : "ПОДЗАДАЧ"} • {stats.label}
          </span>
        </div>
        <ChevronDown size={18} className={[styles.chevron, isOpen ? styles.chevronOpen : ""].join(" ")} />
      </button>

      {isOpen && (
        <div className={styles.body}>
          <div className={styles.subtaskList}>
            {subtasks.map((subtask) => (
              <SubtaskRow
                key={subtask.id}
                subtask={subtask}
                taskNumber={task.number}
                myReport={myReportsBySubtaskId.get(subtask.id)}
                isEnrolled={enrolledSubtaskIds.has(subtask.id)}
                periodId={periodId}
                canSelect={canSelect}
                isParticipating={participatingId === subtask.id}
                onParticipate={() => onParticipate(subtask.id)}
                onReportEnsured={onReportEnsured}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
