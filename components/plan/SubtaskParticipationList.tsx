"use client";

import { useMemo } from "react";
import type { SubtaskParticipationItem } from "../../lib/api/types";
import { SubtaskParticipationRow } from "./SubtaskParticipationRow";
import styles from "./SubtaskParticipationList.module.css";

export type ParticipationFilter = "all" | "mine" | "available";

interface SubtaskParticipationListProps {
  items: SubtaskParticipationItem[];
  filter: ParticipationFilter;
  search: string;
  selectedIds: Set<string>;
  onToggle: (subtaskId: string) => void;
  onUnenroll?: (subtaskId: string) => void;
  unenrollingId?: string | null;
}

export function SubtaskParticipationList({
  items,
  filter,
  search,
  selectedIds,
  onToggle,
  onUnenroll,
  unenrollingId,
}: SubtaskParticipationListProps) {
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "mine" && !item.enrollment) return false;
      if (filter === "available" && item.enrollment) return false;
      if (query) {
        const haystack = [
          item.title,
          item.expectedResult ?? "",
          item.task.title,
          item.direction.name,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [items, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        direction: SubtaskParticipationItem["direction"];
        tasks: Map<string, { task: SubtaskParticipationItem["task"]; items: SubtaskParticipationItem[] }>;
      }
    >();

    for (const item of filteredItems) {
      let directionGroup = map.get(item.direction.id);
      if (!directionGroup) {
        directionGroup = { direction: item.direction, tasks: new Map() };
        map.set(item.direction.id, directionGroup);
      }

      let taskGroup = directionGroup.tasks.get(item.task.id);
      if (!taskGroup) {
        taskGroup = { task: item.task, items: [] };
        directionGroup.tasks.set(item.task.id, taskGroup);
      }
      taskGroup.items.push(item);
    }

    return Array.from(map.values());
  }, [filteredItems]);

  if (grouped.length === 0) {
    return <div className={styles.empty}>Подзадачи не найдены. Измените фильтры или год.</div>;
  }

  return (
    <div className={styles.list}>
      {grouped.map(({ direction, tasks }) => (
        <div key={direction.id} className={styles.direction}>
          <div className={styles.directionHeader}>
            <span className={styles.code}>{direction.code}</span>
            <span className={styles.directionName}>{direction.name}</span>
          </div>

          {Array.from(tasks.values()).map(({ task, items: taskItems }) => (
            <div key={task.id} className={styles.task}>
              <div className={styles.taskTitle}>
                {task.number ? `${task.number}. ` : ""}
                {task.title}
              </div>
              {taskItems.map((item) => (
                <SubtaskParticipationRow
                  key={item.subtaskId}
                  item={item}
                  selected={selectedIds.has(item.subtaskId)}
                  onToggle={onToggle}
                  onUnenroll={onUnenroll}
                  unenrolling={unenrollingId === item.subtaskId}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
